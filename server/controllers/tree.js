const express = require('express');
const mongoose = require('mongoose');
const PersonNode = require('../models/personNode'); 
const Person = require('../models/person');
const FamilyTree = require('../models/familyTree'); 

const treeRouter = express.Router();

// ADD CHILD ROUTE
treeRouter.post('/add-child', async (req, res) => {
  // console.log('Received request:', req.body); 

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

    const parentNode = await PersonNode.findById(nodeId);
    if (!parentNode) {
      console.log('Parent node not found');
      return res.status(404).json({ message: 'Parent node not found' });
    }

    let childNode = await PersonNode.findById(childId);
    if (!childNode) {
      childNode = new PersonNode({
        person: childId,
        parents: [nodeId],
        children: []
      });
    } else if (!childNode.parents.includes(nodeId)) {
      childNode.parents.push(nodeId);
    }

    await childNode.save();
    
    
    if (!parentNode.children.includes(childNode._id)) {
      parentNode.children.push(childNode._id);
      await parentNode.save();
    }

    res.status(200).json({ message: 'Child added successfully' });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ADD PARENT ROUTE
treeRouter.post('/add-parent', async (req, res) => {
  // console.log('Received request:', req.body);

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

    const childNode = await PersonNode.findById(nodeId);
    if (!childNode) {
      console.log('Child node not found');
      return res.status(404).json({ message: 'Child node not found' });
    }

    let parentNode = await PersonNode.findById(parentId);
    if (!parentNode) {
      // Create a new parent node if it does not exist
      parentNode = new PersonNode({
        person: parentId,
        parents: [],
        children: [childNode._id]
      });
      await parentNode.save();
    } else if (!parentNode.children.includes(childNode._id)) {
      parentNode.children.push(childNode._id);
      await parentNode.save();
    }

    // Check if adding this parent will exceed the limit
    if (childNode.parents.length >= 2) {
      return res.status(400).json({ message: 'Cannot add more than two parents' });
    }

    if (!childNode.parents.includes(parentNode._id)) {
      childNode.parents.push(parentNode._id);
      await childNode.save();
    }

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
    // Find the reference node and destination node
    const referenceNode = await PersonNode.findById(referenceId).populate('parents').populate('children').exec();
    const destinationNode = await PersonNode.findById(destinationId).populate('parents').exec();

    if (!referenceNode || !destinationNode) {
      return res.status(404).json({ message: 'Node(s) not found' });
    }

    console.log("REFERENCE NODE", referenceNode);
    console.log("DEST NODE", destinationNode)

    // Helper function to check if a node is in the ancestors of another node
    const isAncestor = async (ancestorId, node) => {
      console.log(`Checking if ${ancestorId} is an ancestor of node ${node._id}`);
    
      if (node.parents.length === 0) {
        console.log(`Node ${node._id} has no parents, returning false`);
        return false;
      }
    
      for (const parent of node.parents) {
        console.log(`Checking parent ${parent._id || parent} of node ${node._id}`);
        
        // Fetch the full parent node if not already populated
        const fullParentNode = await PersonNode.findById(parent._id || parent).populate('parents').exec();
        console.log(`Full parent node: ${JSON.stringify(fullParentNode, null, 2)}`);
        
        if (fullParentNode._id.toString() === ancestorId) {
          console.log(`Ancestor found: ${ancestorId} is a direct parent of node ${node._id}`);
          return true;
        }
    
        // Recursively check the parent's ancestors
        const isParentAncestor = await isAncestor(ancestorId, fullParentNode);
        if (isParentAncestor) {
          console.log(`Ancestor found through recursion: ${ancestorId} is an ancestor of node ${node._id}`);
          return true;
        }
      }
    
      console.log(`No ancestor found for ${ancestorId} in the ancestry of node ${node._id}`);
      return false;
    };
    

    // Helper function to check if a node is in the descendants of another node
    const isDescendant = async (descendantId, node) => {
      console.log(`Checking if ${descendantId} is a descendant of node ${node._id}`);
    
      if (node.children.length === 0) {
        console.log(`Node ${node._id} has no children, returning false`);
        return false;
      }
    
      for (const child of node.children) {
        console.log(`Checking child ${child._id || child} of node ${node._id}`);
        
        // Fetch the full child node if not already populated
        const fullChildNode = await PersonNode.findById(child._id || child).populate('children').exec();
        console.log(`Full child node: ${JSON.stringify(fullChildNode, null, 2)}`);
        
        if (fullChildNode._id.toString() === descendantId) {
          console.log(`Descendant found: ${descendantId} is a direct child of node ${node._id}`);
          return true;
        }
    
        // Recursively check the child's descendants
        const isChildDescendant = await isDescendant(descendantId, fullChildNode);
        if (isChildDescendant) {
          console.log(`Descendant found through recursion: ${descendantId} is a descendant of node ${node._id}`);
          return true;
        }
      }
    
      console.log(`No descendant found for ${descendantId} in the descendants of node ${node._id}`);
      return false;
    };
    

    // Helper function to check if nodes are siblings
    const areSiblings = (node1, node2) => {
      const sharedParents = node1.parents.filter(parentId => 
        node2.parents.some(parentId2 => parentId.toString() === parentId2.toString())
      );
      return sharedParents.length > 0;
    };

    let relationshipType = 'no relationship';

    // Determine the relationship type
    if (await isAncestor(destinationId, referenceNode)) {
      const parent = referenceNode.parents.find(parentId => parentId._id.toString() === destinationId);
      relationshipType = parent ? 'parent' : 'grandparent';
    } else if (await isDescendant(destinationId, referenceNode)) {
      const child = referenceNode.children.find(childId => childId._id.toString() === destinationId);
      relationshipType = child ? 'child' : 'grandchild';
    } else if (areSiblings(referenceNode, destinationNode)) {
      relationshipType = 'sibling';
    }

    console.log("BACKEND ", relationshipType)
    res.status(200).json({ relationshipType });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});


module.exports = treeRouter;
