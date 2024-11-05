const FamilyTreeRepository = require('../repositories/FamilyTreeRepository');
const PersonNodeRepository = require('../repositories/PersonNodeRepository');
const PersonRepository = require('../repositories/PersonRepository');
const UserRepository = require('../repositories/UserRepository');

class TreeService {

  static async getTree(userId) {
    const familyTree = await FamilyTreeRepository.getFamilyTreeByUserId(userId);
    return { status: 200, message: 'Family tree retrieved successfully', familyTree };
  }

  static async addChild(treeId, nodeId, childDetails) {
    try {
      childDetails.treeId = treeId;
      const familyTree = await FamilyTreeRepository.getFamilyTreeById(treeId);
      if (!familyTree) {
        return { status: 404, message: 'Family tree not found' };
      }

      // console.log("NODE ID", nodeId);
      // console.log("FAMILY TREE", familyTree);
      const parentNode = await PersonNodeRepository.getPersonNodeById(nodeId, ['person', 'children', 'parents']);
      if (!parentNode) {
        return { status: 404, message: 'Parent node not found' };
      }

      // console.log("PARENT NODE", parentNode);

      let childPerson = await PersonRepository.findOrCreatePerson(childDetails);
      
      let childNode = await PersonNodeRepository.getPersonNodeByPersonId(childPerson._id, ['person', 'parents']);

      // console.log("CHILD NODE", childNode);
      if (!childNode) {
        childNode = await PersonNodeRepository.createPersonNode({
          person: childPerson._id,
          parents: [nodeId],
          children: [],
          familyTree: treeId
        });
      } else {
        await PersonNodeRepository.addParentToNode(childNode, nodeId);
      }

      await PersonNodeRepository.addChildToNode(parentNode, childNode._id);

      await this.handleSiblingRelationships(parentNode, childNode);

      const potentialMatch = await this.checkForPotentialMatch(childDetails, childNode, treeId);
      
      if (potentialMatch.length > 0) {
        return {
          status: 200,
          message: 'Child added successfully. Potential match found in another user\'s tree.',
          parentNode,
          childNode,
          potentialMatch
        };
      }

      return { status: 200, message: 'Child added successfully', parentNode, childNode };
    } catch (error) {
      console.error('Error in addChild:', error);
      return { status: 500, message: 'Internal Server Error' };
    }
  }

  static async addParent(treeId, nodeId, parentDetails) {

    try {
      parentDetails.treeId = treeId;
      const familyTree = await FamilyTreeRepository.getFamilyTreeById(treeId);
      if (!familyTree) {
        return { status: 404, message: 'Family tree not found' };
      }

      const childNode = await PersonNodeRepository.getPersonNodeById(nodeId, ['person', 'parents']);
      if (!childNode) {
        return { status: 404, message: 'Child node not found' };
      }

      if (childNode.parents.length >= 2) {
        return { status: 400, message: 'Cannot add more than two parents' };
      }

      let parentPerson = await PersonRepository.findOrCreatePerson(parentDetails);
      let parentNode = await PersonNodeRepository.getPersonNodeByPersonId(parentPerson._id, ['person', 'children']);

      if (!parentNode) {
        parentNode = await PersonNodeRepository.createPersonNode({
          person: parentPerson._id,
          children: [childNode._id],
          familyTree: treeId
        });
      } else {
        await PersonNodeRepository.addChildToNode(parentNode, childNode._id);
      }

      await PersonNodeRepository.addParentToNode(childNode, parentNode._id);

      const potentialMatch = await this.checkForPotentialMatch(parentDetails, parentNode, treeId);

      if (potentialMatch.length > 0) {
        return {
          status: 200,
          message: 'Parent added successfully. Potential match found in another user\'s tree.',
          parentNode,
          childNode,
          potentialMatch
        };
      }

      return { status: 200, message: 'Parent added successfully', parentNode, childNode };
    } catch (error) {
      console.error('Error in addParent:', error);
      return { status: 500, message: 'Internal Server Error' };
    }
  }

  static async checkRelationship(referenceId, destinationId) {
    try {

      if (!referenceId || !destinationId) {
        return { status: 400, message: 'Invalid request parameters' };
      }
      
      const referenceNode = await PersonNodeRepository.getPersonNodeById(referenceId, ['person', 'parents', 'children']);
      const destinationNode = await PersonNodeRepository.getPersonNodeById(destinationId, ['person', 'parents', 'children']);
      
      if (!referenceNode || !destinationNode) {
        return { status: 404, message: 'Node(s) not found' };
      }

      // Logic to determine relationship
      const relationshipType = await this.determineRelationship(referenceNode, destinationNode);
      return { status: 200, message: 'Relationship determined successfully', relationshipType };
    } catch (error) {
      console.error('Error in checkRelationship:', error);
      return { status: 500, message: 'Internal Server Error' };
    }
  }

  static async handleSiblingRelationships(parentNode, childNode) {
    for (const sibling of parentNode.children) {
      const siblingNode = await PersonNodeRepository.getPersonNodeById(sibling._id, ['person', 'parents']);
      if (siblingNode.parents.length === 2) {
        const otherParentNode = siblingNode.parents.find(parent => !parent._id.equals(parentNode._id));
        if (otherParentNode) {
          await PersonNodeRepository.addChildToNode(otherParentNode, childNode._id);
          await PersonNodeRepository.addParentToNode(childNode, otherParentNode._id);
        }
      }
    }
  }

  static async checkForPotentialMatch(personDetails, newNode, userTreeId) {
    const allUsers = await UserRepository.getAllUsers();
    const potentialMatches = [];
    
    for (const user of allUsers) {
      const userTree = await FamilyTreeRepository.getFamilyTreeByUserId(user._id);
      if (userTree) {
        const similarPersons = await this.findSimilarPersonInTree(userTreeId, personDetails);
        
        for (const existingPerson of similarPersons) {
          const existingNode = await PersonNodeRepository.getPersonNodeByPersonId(existingPerson._id, ['parents', 'children']);
          const hasCommonRelatives = await this.checkForCommonRelatives(newNode, existingNode);
          
          const potentialMatch = {
            personId: existingPerson._id,
            treeId: existingPerson.treeId,
            hasCommonRelatives
          };

          // Check if this person is already in potentialMatches
          const isDuplicate = potentialMatches.some(match => 
            match.personId.toString() === potentialMatch.personId.toString() &&
            match.treeId.toString() === potentialMatch.treeId.toString()
          );

          if (!isDuplicate) {
            potentialMatches.push(potentialMatch);
          }
        }
      }
    }
    
    return potentialMatches;
  }

  static async findSimilarPersonInTree(treeId, personDetails) {
    const { name, birthdate, deathdate } = personDetails;

    const similarPersons = await PersonRepository.findSimilarPersons(personDetails);

    const filteredPersons = similarPersons.filter(person => person.treeId && person.treeId.toString() !== treeId);
    return filteredPersons;
  }

  static async checkForCommonRelatives(newNode, existingNode) {
    const newNodeRelatives = [...newNode.parents, ...newNode.children];
    const existingNodeRelatives = [...existingNode.parents, ...existingNode.children];
    
    // Iterate through each relative of the newNode
    for (const newRelative of newNodeRelatives) {
      const newRelativeNode = await PersonNodeRepository.getPersonNodeById(newRelative._id || newRelative, ['person']);
      const newRelativePerson = newRelativeNode.person;

      // Iterate through each relative of the existingNode
      for (const existingRelative of existingNodeRelatives) {
        const existingRelativeNode = await PersonNodeRepository.getPersonNodeById(existingRelative._id || existingRelative, ['person']);
        const existingRelativePerson = existingRelativeNode.person;

        if (this.comparePersonDetails(newRelativePerson, existingRelativePerson)) {
          return true;
        }
      }
    }
    
    return false; 
  }

  static comparePersonDetails(person1, person2) {
    const nameMatch = person1.name.trim().toLowerCase() === person2.name.trim().toLowerCase();
    const birthdateMatch = person1.birthdate && person2.birthdate && new Date(person1.birthdate).getTime() === new Date(person2.birthdate).getTime();

    return nameMatch && birthdateMatch;
  }

  static async isAncestor(ancestorId, node, generation = 1) {
    if (node.parents.length === 0) return false;

    for (const parent of node.parents) {
      const fullParentNode = await PersonNodeRepository.getPersonNodeById(parent._id || parent, ['parents', 'person']);
      if (fullParentNode._id.toString() === ancestorId) return generation;

      const ancestorGeneration = await this.isAncestor(ancestorId, fullParentNode, generation + 1);
      if (ancestorGeneration) return ancestorGeneration;
    }
  }

  static areSiblings(node1, node2) {
    const normalizeParents = (parents) => {
      if (!Array.isArray(parents)) return [];
      return parents.flat().map(parentId => parentId.toString());
    };

    const node1Parents = normalizeParents(node1.parents);
    const node2Parents = normalizeParents(node2.parents);

    const sharedParents = node1Parents.filter(parentId => node2Parents.includes(parentId));
    
    return sharedParents.length > 0;
  }

  static async findDegreeCousin(node1, node2) {
    const node1Ancestors = await this.getAncestors(node1);
    const node2Ancestors = await this.getAncestors(node2);

    let closestCommonAncestor = null;
    let node1Generation = 0;
    let node2Generation = 0;

    for (let i = 0; i < node1Ancestors.length; i++) {
      for (let j = 0; j < node2Ancestors.length; j++) {
        if (node1Ancestors[i]._id.toString() === node2Ancestors[j]._id.toString()) {
          closestCommonAncestor = node1Ancestors[i];
          node1Generation = i;
          node2Generation = j;
          break;
        }
      }
      if (closestCommonAncestor) break;
    }

    if (closestCommonAncestor) {
      const cousinDegree = Math.min(node1Generation, node2Generation);
      const removalDegree = Math.abs(node1Generation - node2Generation);
      let relationshipType = `${cousinDegree == 1 ? "" : cousinDegree + " "}cousin`;
      if (removalDegree > 0) {
        relationshipType += ` ${removalDegree} times removed`;
      }
      return { status: 200, message: 'Cousin found', relationshipType, cousinDegree, removalDegree };
    }

    return false;
  }

  static async getAncestors(node, generation = 0) {
    let ancestors = [];
    for (const parent of node.parents) {
      const fullParentNode = await PersonNodeRepository.getPersonNodeById(parent._id || parent, ['parents', 'person']);
      ancestors.push(fullParentNode);
      const parentAncestors = await this.getAncestors(fullParentNode, generation + 1);
      ancestors = ancestors.concat(parentAncestors);
    }
    return ancestors;
  }

  static async findUncleAuntOrNephewNiece(node1, node2) {
    for (const parent of node1.parents) {
      const parentNode = await PersonNodeRepository.getPersonNodeById(parent._id || parent, ['children', 'parents', 'person']);
      // console.log("PARENT NODE", parentNode);
      // console.log("NODE 2 NODE", node2);

      // Re-run the sibling check after fixing possible data issues
      const isSibling = this.areSiblings(parentNode, node2);
      // console.log("ISH SIBLING", isSibling)
      if (isSibling) return { status: 200, message: 'Uncle/Aunt found', relationshipType: 'uncle/aunt' };

      const isUncleAunt = await this.isDescendant(node2._id, parentNode, 2);
      if (isUncleAunt) return { status: 200, message: 'Nephew/Niece found', relationshipType: 'nephew/niece' };
    }

    return false;
  }

  static async isDescendant(descendantId, node, generation = 1, path = []) {
    // console.log("DES ID ", descendantId.toString(), "NODE ID", node._id.toString());

    path.push({
      nodeId: node._id.toString(),
      nodeName: node.person.name,
      generation: generation
    });

    if (node._id.toString() === descendantId.toString()) {
      // console.log(`Descendant found: ${node.person.name} at generation ${generation}. Path:`, path);
      return generation - 1;
    }

    if (node.children.length === 0) {
      // console.log(`No children found at generation ${generation}. Current path:`, path);
      return false;
    }

    // Recursively check each child
    for (const child of node.children) {
      const fullChildNode = await PersonNodeRepository.getPersonNodeById(child._id || child, ['children', 'person']);
      // console.log(`Visiting child: ${fullChildNode.person.name} at generation ${generation + 1}. Current path:`, path);

      const descendantGeneration = await this.isDescendant(descendantId, fullChildNode, generation + 1, [...path]);
      if (descendantGeneration) {
        return descendantGeneration;
      }
    }

    // console.log(`Backtracking from node: ${node.person.name} at generation ${generation}. Current path:`, path);
    // return false;
  }

  static async determineRelationship(referenceNode, destinationNode) {
    try {
      let relationshipType = 'no relationship';

      const ancestorGeneration = await this.isAncestor(destinationNode._id.toString(), referenceNode);
      const descendantGeneration = await this.isDescendant(destinationNode._id.toString(), referenceNode);

      if (ancestorGeneration) {
        if (ancestorGeneration === 1) relationshipType = 'parent';
        else if (ancestorGeneration === 2) relationshipType = 'grandparent';
        else relationshipType = `great-${'great-'.repeat(ancestorGeneration - 3)}grandparent`;
      } else if (descendantGeneration) {
        if (descendantGeneration === 1) relationshipType = 'child';
        else if (descendantGeneration === 2) relationshipType = 'grandchild';
        else relationshipType = `great-${'great-'.repeat(descendantGeneration - 3)}grandchild`;
      } else if (this.areSiblings(referenceNode, destinationNode)) {
        relationshipType = 'sibling';
      } else {
        const uncleAuntNephewNiece = await this.findUncleAuntOrNephewNiece(referenceNode, destinationNode);
        if (uncleAuntNephewNiece) {
          relationshipType = uncleAuntNephewNiece.relationshipType;
        } else {
          const cousin = await this.findDegreeCousin(referenceNode, destinationNode);
          if (cousin) {
            relationshipType = cousin.relationshipType;
          }
        }
      }
      return relationshipType;
    } catch (error) {
      console.error('Error in determineRelationship:', error);
      return { status: 500, message: 'Internal Server Error' };
    }
  }
}

module.exports = TreeService;
