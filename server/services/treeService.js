const treeRepository = require('../repositories/treeRepository');
const Person = require("../models/person")

const addChild = async (treeId, nodeId, childDetails) => {
  try {
    let isParentAlreadyLinked = false;

    const familyTree = await treeRepository.getFamilyTreeById(treeId);
    if (!familyTree) {
      return { status: 404, message: 'Family tree not found' };
    }

    const parentNode = await treeRepository.getPersonNodeById(nodeId, ['person', 'children', 'parents']);
    if (!parentNode) {
      return { status: 404, message: 'Parent node not found' };
    }

    // Find or create a child by name, birthdate, and deathdate
    let childPerson = await Person.findOne(childDetails);
    if (!childPerson) {
      // If the person does not exist, create a new Person
      childPerson = await Person.create(childDetails);
    }

    let childNode = await treeRepository.getPersonNodeByPersonId(childPerson._id, ['person', 'parents']);
    if (!childNode) {
      // Create a new child node if it doesn't exist
      childNode = await treeRepository.createPersonNode({
        person: childPerson._id,
        parents: [nodeId],
        children: []
      });
    } else {
      // Check if the child-parent relationship already exists
      isParentAlreadyLinked = childNode.parents.some(parent => parent._id.equals(parentNode._id));
      if (!isParentAlreadyLinked) {
        // Add the parent to the child's parents array
        await treeRepository.addParentToNode(childNode, nodeId);
      }
    }

    // Check if the parent-child relationship already exists
    const isChildAlreadyLinked = parentNode.children.some(child => child._id.equals(childNode._id));
    if (!isChildAlreadyLinked) {
      // Add the child to the parent's children array
      await treeRepository.addChildToNode(parentNode, childNode._id);
    }

    // Check if the current parent has other children
    if (parentNode.children.length > 0) {
      for (const sibling of parentNode.children) {
        const siblingNode = await treeRepository.getPersonNodeById(sibling._id, ['person', 'parents']);

        // If the sibling has two parents, find the other parent
        if (siblingNode.parents.length === 2) {
          const otherParentNode = siblingNode.parents.find(parent => !parent._id.equals(parentNode._id));

          if (otherParentNode) {
            const isChildLinkedToOtherParent = otherParentNode.children.some(child => child._id.equals(childNode._id));

            // Add the child to the other parent's children if not already present
            if (!isChildLinkedToOtherParent) {
              await treeRepository.addChildToNode(otherParentNode, childNode._id);

              // Also ensure the child knows the other parent
              const isChildLinkedToParent = childNode.parents.some(parent => parent._id.equals(otherParentNode._id));
              if (!isChildLinkedToParent) {
                await treeRepository.addParentToNode(childNode, otherParentNode._id);
              }
            }
          }
        }
      }
    }

    // Return success response only if an actual addition happened
    if (!isChildAlreadyLinked || !isParentAlreadyLinked) {
      return { status: 200, message: 'Child added successfully', parentNode, childNode };
    } else {
      return { status: 400, message: 'Child is already linked to the parent', parentNode, childNode };
    }
  } catch (error) {
    console.error('Error in addChild:', error);
    return { status: 500, message: 'Internal Server Error' };
  }
};

const addParent = async (treeId, nodeId, parentDetails) => {
  try {
    let isChildAlreadyLinked = false;

    const familyTree = await treeRepository.getFamilyTreeById(treeId);
    if (!familyTree) {
      return { status: 404, message: 'Family tree not found' };
    }

    const childNode = await treeRepository.getPersonNodeById(nodeId, ['person', 'parents']);
    if (!childNode) {
      return { status: 404, message: 'Child node not found' };
    }

    // Check if the child already has two parents
    if (childNode.parents.length >= 2) {
      return { status: 400, message: 'Cannot add more than two parents' };
    }

    // Find or create a parent by name, birthdate, and deathdate
    let parentPerson = await Person.findOne(parentDetails);
    if (!parentPerson) {
      // If the person does not exist, create a new Person
      parentPerson = await Person.create(parentDetails);
    }

    let parentNode = await treeRepository.getPersonNodeByPersonId(parentPerson._id, ['person', 'children']);
    if (!parentNode) {
      // Create a new parent node if it doesn't exist
      parentNode = await treeRepository.createPersonNode({
        person: parentPerson._id,
        children: [childNode._id]
      });
    } else {
      // Check if the child is already linked to this parent
      isChildAlreadyLinked = parentNode.children.some(child => child._id.equals(childNode._id));
      if (!isChildAlreadyLinked) {
        await treeRepository.addChildToNode(parentNode, childNode._id);
      }
    }

    // Check if the parent is already linked to this child
    const isParentAlreadyLinked = childNode.parents.some(parent => parent._id.equals(parentNode._id));
    if (!isParentAlreadyLinked) {
      await treeRepository.addParentToNode(childNode, parentNode._id);
    }

    // Return success response only if an actual addition happened
    if (!isChildAlreadyLinked || !isParentAlreadyLinked) {
      return { status: 200, message: 'Parent added successfully', parentNode, childNode };
    } else {
      return { status: 400, message: 'Parent is already linked to the child', parentNode, childNode };
    }
  } catch (error) {
    console.error('Error in addParent:', error);
    return { status: 500, message: 'Internal Server Error' };
  }
};



const checkRelationship = async (referenceId, destinationId) => {
  try {
    const referenceNode = await treeRepository.getPersonNodeById(referenceId, ['person', 'parents', 'children']);
    const destinationNode = await treeRepository.getPersonNodeById(destinationId, ['person', 'parents', 'children']);
    

    // console.log(referenceNode)
    // console.log(destinationNode)
    if (!referenceNode || !destinationNode) {
      console.log("NOT FOUND BOTH NODES")
      return { status: 404, message: 'Node(s) not found' };
    }

    // Logic to determine relationship
    const relationshipType = await determineRelationship(referenceNode, destinationNode);
    return { status: 200, message: 'Relationship determined successfully', relationshipType };
  } catch (error) {
    console.error('Error in checkRelationship:', error);
    return { status: 500, message: 'Internal Server Error' };
  }
};

const isAncestor = async (ancestorId, node, generation = 1) => {
  if (node.parents.length === 0) return false;

  for (const parent of node.parents) {
    const fullParentNode = await treeRepository.getPersonNodeById(parent._id || parent, ['parents', 'person']);
    if (fullParentNode._id.toString() === ancestorId) return generation;

    const ancestorGeneration = await isAncestor(ancestorId, fullParentNode, generation + 1);
    if (ancestorGeneration) return ancestorGeneration;
  }
};



const areSiblings = (node1, node2) => {
  // Flatten and normalize parent arrays, and convert all parent IDs to strings
  const normalizeParents = (parents) => {
    if (!Array.isArray(parents)) return [];
    return parents.flat().map(parentId => parentId.toString());
  };

  const node1Parents = normalizeParents(node1.parents);
  const node2Parents = normalizeParents(node2.parents);

  // Check for shared parents
  const sharedParents = node1Parents.filter(parentId => node2Parents.includes(parentId));
  
  return sharedParents.length > 0;
};

const findDegreeCousin = async (node1, node2) => {
  const node1Ancestors = await getAncestors(node1);
  const node2Ancestors = await getAncestors(node2);

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
};

const getAncestors = async (node, generation = 0) => {
  let ancestors = [];
  for (const parent of node.parents) {
    const fullParentNode = await treeRepository.getPersonNodeById(parent._id || parent, ['parents', 'person']);
    ancestors.push(fullParentNode);
    const parentAncestors = await getAncestors(fullParentNode, generation + 1);
    ancestors = ancestors.concat(parentAncestors);
  }
  return ancestors;
};

const findUncleAuntOrNephewNiece = async (node1, node2) => {
  for (const parent of node1.parents) {
    const parentNode = await treeRepository.getPersonNodeById(parent._id || parent, ['children', 'parents', 'person']);
    // console.log("PARENT NODE", parentNode);
    // console.log("NODE 2 NODE", node2);

    // Re-run the sibling check after fixing possible data issues
    const isSibling = areSiblings(parentNode, node2);
    // console.log("ISH SIBLING", isSibling)
    if (isSibling) return { status: 200, message: 'Uncle/Aunt found', relationshipType: 'uncle/aunt' };

    const isUncleAunt = await isDescendant(node2._id, parentNode, 2);
    if (isUncleAunt) return { status: 200, message: 'Nephew/Niece found', relationshipType: 'nephew/niece' };
  }

  return false;
};



const isDescendant = async (descendantId, node, generation = 1, path = []) => {
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
    const fullChildNode = await treeRepository.getPersonNodeById(child._id || child, ['children', 'person']);
    // console.log(`Visiting child: ${fullChildNode.person.name} at generation ${generation + 1}. Current path:`, path);

    const descendantGeneration = await isDescendant(descendantId, fullChildNode, generation + 1, [...path]);
    if (descendantGeneration) {
      return descendantGeneration;
    }
  }

  // console.log(`Backtracking from node: ${node.person.name} at generation ${generation}. Current path:`, path);
  // return false;
};



const determineRelationship = async (referenceNode, destinationNode) => {
  try {
    let relationshipType = 'no relationship';

    const ancestorGeneration = await isAncestor(destinationNode._id.toString(), referenceNode);
    const descendantGeneration = await isDescendant(destinationNode._id.toString(), referenceNode);

    if (ancestorGeneration) {
      if (ancestorGeneration === 1) relationshipType = 'parent';
      else if (ancestorGeneration === 2) relationshipType = 'grandparent';
      else relationshipType = `great-${'great-'.repeat(ancestorGeneration - 3)}grandparent`;
    } else if (descendantGeneration) {
      if (descendantGeneration === 1) relationshipType = 'child';
      else if (descendantGeneration === 2) relationshipType = 'grandchild';
      else relationshipType = `great-${'great-'.repeat(descendantGeneration - 3)}grandchild`;
    } else if (areSiblings(referenceNode, destinationNode)) {
      relationshipType = 'sibling';
    } else {
      const uncleAuntNephewNiece = await findUncleAuntOrNephewNiece(referenceNode, destinationNode);
      if (uncleAuntNephewNiece) {
        relationshipType = uncleAuntNephewNiece.relationshipType;
      } else {
        const cousin = await findDegreeCousin(referenceNode, destinationNode);
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
};

module.exports = {
  addChild,
  addParent,
  checkRelationship,
  determineRelationship
};
