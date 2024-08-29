const treeRepository = require('../repositories/treeRepository');

const addChild = async (treeId, nodeId, childId) => {
  try {
    // Retrieve the family tree
    const familyTree = await treeRepository.getFamilyTreeById(treeId);
    if (!familyTree) {
      return { status: 404, message: 'Family tree not found' };
    }

    // Retrieve the parent node
    const parentNode = await treeRepository.getPersonNodeById(nodeId, ['person', 'children', 'parents']);
    if (!parentNode) {
      return { status: 404, message: 'Parent node not found' };
    }

    // Retrieve or create the child node
    let childNode = await treeRepository.getPersonNodeById(childId, ['person', 'parents']);
    if (!childNode) {
      // If the child node doesn't exist, create it with the current parent node as its parent
      childNode = await treeRepository.createPersonNode({ person: childId, parents: [nodeId], children: [] });
    } else {
      // Ensure the child-parent relationship does not already exist
      if (!childNode.parents.some(parent => parent._id.equals(parentNode._id))) {
        await treeRepository.addParentToNode(childNode, nodeId);
      }
    }

    // Ensure the parent-child relationship does not already exist
    if (!parentNode.children.some(child => child._id.equals(childNode._id))) {
      await treeRepository.addChildToNode(parentNode, childNode._id);
    }

    // Return success response
    return { status: 200, message: 'Child added successfully', parentNode, childNode };
  } catch (error) {
    console.error('Error in addChild:', error);
    return { status: 500, message: 'Internal Server Error' };
  }
};

const  addParent = async (treeId, nodeId, parentId) => {
  try {
    const familyTree = await treeRepository.getFamilyTreeById(treeId);
    if (!familyTree) {
      return { status: 404, message: 'Family tree not found' };
    }

    const childNode = await treeRepository.getPersonNodeById(nodeId, ['person', 'parents']);
    if (!childNode) {
      return { status: 404, message: 'Child node not found' };
    }

    // console.log("TEST CHILD NODE", childNode);
    if (childNode.parents.length >= 2) {
      console.log("IT HAS 2 PARENTS ALREADY!");
      return { status: 400, message: 'Cannot add more than two parents' };
    }
    // console.log("PARENT ID ", parentId)
    let parentNode = await treeRepository.getPersonNodeById(parentId, ['person', 'children']);
    // console.log("TEST PARENT NODE", parentNode);
    if (!parentNode) {
      parentNode = await treeRepository.createPersonNode({ person: parentId, children: [childNode._id] });
    } else {
      if (!parentNode.children.some(child => child._id.equals(childNode._id))) {
        await treeRepository.addChildToNode(parentNode, childNode._id);
      }
    }

    console.log("CHECK 1");
    if (!childNode.parents.some(parent => parent._id.equals(parentNode._id))) {
      await treeRepository.addParentToNode(childNode, parentNode._id);
    }

    return { status: 200, message: 'Parent added successfully', parentNode, childNode };
  } catch (error) {
    console.error('Error in addParent:', error);
    throw error;
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
const findCousin = async (node1, node2) => {
  for (const parent of node1.parents) {
    const parentNode = await treeRepository.getPersonNodeById(parent._id || parent, ['children', 'person']);
    for (const uncleAunt of parentNode.children) {
      const fullUncleAuntNode = await treeRepository.getPersonNodeById(uncleAunt._id || uncleAunt, ['children', 'person']);
      for (const cousin of fullUncleAuntNode.children) {
        if (cousin._id.toString() === node2._id.toString()) {
          return { status: 200, message: 'Cousin found', relationshipType: 'cousin' };
        }
      }
    }
  }

  return false;
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

  // Add the current node to the path
  path.push({
    nodeId: node._id.toString(),
    nodeName: node.person.name,
    generation: generation
  });

  // First, check if the current node is the descendant
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

    // Check if referenceNode is an ancestor of destinationNode
    const ancestorGeneration = await isAncestor(destinationNode._id.toString(), referenceNode);
    // console.log("ANCESTOR", ancestorGeneration)
    // Check if referenceNode is a descendant of destinationNode
    const descendantGeneration = await isDescendant(destinationNode._id.toString(), referenceNode);
    // console.log("DESCENT", descendantGeneration)
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
      // console.log("UNCLE AUNT", uncleAuntNephewNiece)
      if (uncleAuntNephewNiece) {
        relationshipType = uncleAuntNephewNiece.relationshipType;
      } else {
        const cousin = await findCousin(referenceNode, destinationNode);
        if (cousin) {
          relationshipType = cousin.relationshipType;
        }
      }
    }
    return relationshipType ;
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
