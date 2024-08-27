const express = require('express');
const mongoose = require('mongoose');
const PersonNode = require('../models/personNode'); 
const Person = require('../models/person');
const FamilyTree = require('../models/familyTree'); 

const treeRouter = express.Router();

// ADD CHILD ROUTE
treeRouter.post('/add-child', async (req, res) => {
  const { treeId, nodeId, childId } = req.body;

  if (!treeId || !nodeId || !childId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  try {
    const familyTree = await FamilyTree.findById(treeId);
    if (!familyTree) {
      console.log('Family tree not found');
      return res.status(404).json({ message: 'Family tree not found' });
    }

    const parentNode = await PersonNode.findById(nodeId).populate('person').populate('children').populate('parents');
    if (!parentNode) {
      console.log('Parent node not found');
      return res.status(404).json({ message: 'Parent node not found' });
    }

    let childNode = await PersonNode.findById(childId).populate('person').populate('parents');
    if (!childNode) {
      childNode = new PersonNode({
        person: childId,
        parents: [nodeId],
        children: []
      });
    } else if (!childNode.parents.some(parent => parent._id.equals(nodeId))) {
      childNode.parents.push(nodeId);
    }

    await childNode.save();
    
    if (!parentNode.children.some(child => child._id.equals(childNode._id))) {
      parentNode.children.push(childNode._id);
      await parentNode.save();
    }

    console.log('Parent Node:', JSON.stringify(parentNode, null, 2));
    console.log('Child Node:', JSON.stringify(childNode, null, 2));

    res.status(200).json({ message: 'Child added successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ADD PARENT ROUTE
treeRouter.post('/add-parent', async (req, res) => {
  const { treeId, nodeId, parentId } = req.body;

  if (!treeId || !nodeId || !parentId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  try {
    const familyTree = await FamilyTree.findById(treeId);
    if (!familyTree) {
      console.log('Family tree not found');
      return res.status(404).json({ message: 'Family tree not found' });
    }

    const childNode = await PersonNode.findById(nodeId).populate('person').populate('parents');
    if (!childNode) {
      console.log('Child node not found');
      return res.status(404).json({ message: 'Child node not found' });
    }

    let parentNode = await PersonNode.findById(parentId).populate('person').populate('children');
    if (!parentNode) {
      parentNode = new PersonNode({
        person: parentId,
        parents: [],
        children: [childNode._id]
      });
      await parentNode.save();
    } else if (!parentNode.children.some(child => child._id.equals(childNode._id))) {
      parentNode.children.push(childNode._id);
      await parentNode.save();
    }

    if (childNode.parents.length >= 2) {
      return res.status(400).json({ message: 'Cannot add more than two parents' });
    }

    if (!childNode.parents.some(parent => parent._id.equals(parentNode._id))) {
      childNode.parents.push(parentNode._id);
      await childNode.save();
    }

    console.log('Parent Node:', JSON.stringify(parentNode, null, 2));
    console.log('Child Node:', JSON.stringify(childNode, null, 2));

    res.status(200).json({ message: 'Parent added successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// CHECK RELATIONSHIP ROUTE
treeRouter.post('/check-relationship', async (req, res) => {
  const { referenceId, destinationId } = req.body;

  if (!referenceId || !destinationId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  try {
    const referenceNode = await PersonNode.findById(referenceId).populate('person').populate('parents').populate('children').exec();
    const destinationNode = await PersonNode.findById(destinationId).populate('person').populate('parents').populate('children').exec();

    if (!referenceNode || !destinationNode) {
      return res.status(404).json({ message: 'Node(s) not found' });
    }

    console.log("REFERENCE NODE", JSON.stringify(referenceNode, null, 2));
    console.log("DEST NODE", JSON.stringify(destinationNode, null, 2));

    const isAncestor = async (ancestorId, node, generation = 1) => {
      console.log(`Entering generation ${generation}: Checking node ${node._id || node} with parents count: ${node.parents.length}`);
    
      if (node.parents.length === 0) {
        console.log(`Generation ${generation}: Node ${node._id || node} has no parents. Returning false.`);
        return false;
      }
    
      for (const parent of node.parents) {
        const fullParentNode = await PersonNode.findById(parent._id || parent).populate('parents').populate('person').exec();
        
        console.log(`Generation ${generation}: Checking parent node ${fullParentNode._id}`);
    
        if (fullParentNode._id.toString() === ancestorId) {
          console.log(`Generation ${generation}: Found ancestor with ID ${ancestorId} at generation ${generation}`);
          return generation;
        }
    
        const ancestorGeneration = await isAncestor(ancestorId, fullParentNode, generation + 1);
        if (ancestorGeneration) {
          console.log(`Generation ${generation}: Found ancestor in earlier generation. Returning generation ${ancestorGeneration}`);
          return ancestorGeneration;
        }
      }
    
      console.log(`Generation ${generation}: No match found for ancestor ${ancestorId} in node ${node._id || node}. Returning false.`);
      return false;
    };
    

    const isDescendant = async (descendantId, node, generation = 1) => {
      console.log(`Entering generation ${generation}: Checking node ${node._id || node} with children count: ${node.children.length}`);
    
      if (node.children.length === 0) {
        console.log(`Generation ${generation}: Node ${node._id || node} has no children. Returning false.`);
        return false;
      }
    
      for (const child of node.children) {
        const fullChildNode = await PersonNode.findById(child._id || child).populate('children').populate('person').exec();
        
        console.log(`Generation ${generation}: Checking child node ${fullChildNode._id}`);
    
        if (fullChildNode._id.toString() === descendantId) {
          console.log(`Generation ${generation}: Found descendant with ID ${descendantId} at generation ${generation}`);
          return generation;
        }
    
        const descendantGeneration = await isDescendant(descendantId, fullChildNode, generation + 1);
        if (descendantGeneration) {
          console.log(`Generation ${generation}: Found descendant in deeper generation. Returning generation ${descendantGeneration}`);
          return descendantGeneration;
        }
      }
    
      console.log(`Generation ${generation}: No match found for descendant ${descendantId} in node ${node._id || node}. Returning false.`);
      return false;
    };
    

    const areSiblings = (node1, node2) => {
      const sharedParents = node1.parents.filter(parentId => 
        node2.parents.some(parentId2 => parentId.toString() === parentId2.toString())
      );
      return sharedParents.length > 0;
    };

    const findUncleAuntOrNephewNiece = async (node1, node2) => {
      for (const parent of node1.parents) {
        const parentNode = await PersonNode.findById(parent._id || parent).populate('children').populate('person').exec();
        const isSibling = areSiblings(parentNode, node2);
        if (isSibling) return 'uncle/aunt';
        
        const isUncleAunt = await isDescendant(node2._id, parentNode, 2);
        if (isUncleAunt) return 'nephew/niece';
      }

      return false;
    };

    const findCousin = async (node1, node2) => {
      for (const parent of node1.parents) {
        const parentNode = await PersonNode.findById(parent._id || parent).populate('children').populate('person').exec();

        for (const uncleAunt of parentNode.children) {
          const fullUncleAuntNode = await PersonNode.findById(uncleAunt._id || uncleAunt).populate('children').populate('person').exec();
          
          for (const cousin of fullUncleAuntNode.children) {
            if (cousin._id.toString() === node2._id.toString()) {
              return 'cousin';
            }
          }
        }
      }

      return false;
    };

    let relationshipType = 'no relationship';

    const ancestorGeneration = await isAncestor(destinationId, referenceNode);
    const descendantGeneration = await isDescendant(destinationId, referenceNode);

    console.log("ANCESTOR GENERATION", ancestorGeneration)
    console.log("DESCENDANT GENERATION", descendantGeneration)
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
        relationshipType = uncleAuntNephewNiece;
      } else {
        const cousin = await findCousin(referenceNode, destinationNode);
        if (cousin) {
          relationshipType = cousin;
        }
      }
    }

    console.log("BACKEND ", relationshipType);
    res.status(200).json({ relationshipType });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = treeRouter;
