const express = require('express');
const mongoose = require('mongoose');
const PersonNode = require('../models/personNode'); 
const Person = require('../models/person');
const FamilyTree = require('../models/familyTree'); 

const treeRouter = express.Router();

treeRouter.post('/add-child', async (req, res) => {
  console.log('Received request:', req.body); 

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



module.exports = treeRouter;
