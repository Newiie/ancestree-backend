const express = require('express');
const TreeService = require('../services/TreeService');
const PersonNodeService = require('../services/PersonNodeService');
const ImageService = require('../services/ImageService');
const TreeRouter = express.Router();
const { jwtMiddleware } = require('../utils/middleware');
const { upload } = require('../utils/helper');

// PUBLIC GET TREE ROUTE
TreeRouter.get('/family-tree/:userId', async (req, res, next) => {
  try { 
    const { userId } = req.params;
    const familyTree = await TreeService.getTree(userId);
    res.status(200).json({ message: 'Family tree retrieved successfully', familyTree });
  } catch (error) {
    if (error.message === 'Family tree not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// --------------JWT MIDDLEWARE--------------
TreeRouter.use(jwtMiddleware);

// CONNECT PERSON TO USER ROUTE
TreeRouter.post('/connect-person/:userId', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { gUserID } = req;
    const { nodeId } = req.body;
    const result = await TreeService.requestConnectPersonToUser(gUserID, userId, nodeId);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Sender not found') {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

TreeRouter.patch('/accept-connection-request/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { gUserID } = req;
    const result = await TreeService.acceptConnectionRequest(gUserID, nodeId);
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// ADD CHILD ROUTE
TreeRouter.post('/add-child', upload.single('generalInformation[profilePicture]'), async (req, res, next) => {
  try {
    const { nodeId } = req.body;
    const treeId = req.headers['x-tree-id'];
    const { gUserID } = req;
    let profilePicture = null;
    // Handle file upload if present
    if (req.file) {
      profilePicture = await ImageService.uploadFamilyMemberPicture(req.file, `${treeId}-${nodeId}`);
    }

    const childDetails = {
      generalInformation: req.body.generalInformation,
      vitalInformation: {
        sex: req.body.vitalInformation.sex
      },
      profilePicture
    }

    if (!nodeId || !childDetails) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    if (!treeId) {
      return res.status(400).json({ error: 'Tree ID is required' });
    }

    const result = await TreeService.addChild(treeId, nodeId, childDetails, gUserID);
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// ADD PARENT ROUTE
TreeRouter.post('/add-parent', upload.single('generalInformation[profilePicture]'), async (req, res, next) => {
  try {
    const { nodeId } = req.body;
    const treeId = req.headers['x-tree-id'];
    const { gUserID } = req;

    let profilePicture = null;
    // Handle file upload if present
    if (req.file) {
      profilePicture = await ImageService.uploadFamilyMemberPicture(req.file, `${treeId}-${nodeId}`);
    }

    const parentDetails = {
      generalInformation: req.body.generalInformation,
      vitalInformation: {
        sex: req.body.vitalInformation.sex
      },
      profilePicture
    }

    if (!treeId || !nodeId || !parentDetails) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    if (!treeId) {
      return res.status(400).json({ error: 'Tree ID is required' });
    }

    const result = await TreeService.addParent(treeId, nodeId, parentDetails, gUserID);
    res.status(200).json(result);
  } catch (error) {
    if (error.message === 'Cannot add more than two parents') {
      res.status(400).json({ error: error.message });
    } else if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// UPDATE Person
TreeRouter.patch('/update-node/:nodeId', upload.single('generalInformation[profilePicture]'), async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { body } = req;

    if (!nodeId || !body) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    let profilePicture = null;
    // Handle file upload if present
    if (req.file) {
      profilePicture = await ImageService.uploadFamilyMemberPicture(req.file, `${nodeId}`);
      req.body.profilePicture = profilePicture;
    }

    const updatedNode = await PersonNodeService.updatePersonNode(nodeId, body);
    res.status(200).json({ message: 'Node updated successfully', updatedNode });
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

// DELETE Person
TreeRouter.delete('/delete-node/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const deletedNode = await PersonNodeService.deletePersonNode(nodeId);
    res.status(200).json({ message: 'Node deleted successfully', deletedNode });
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});



// CHECK RELATIONSHIP ROUTE
TreeRouter.get('/check-relationship', async (req, res, next) => {
  try {
    const { referenceId, destinationId } = req.body;
    
    if (!referenceId || !destinationId) {
      return res.status(400).json({ error: 'Invalid request parameters' });
    }

    const result = await TreeService.checkRelationship(referenceId, destinationId);
    res.status(200).json(result);
  } catch (error) {
    if (error.message.includes('not found')) {
      res.status(404).json({ error: error.message });
    } else {
      next(error);
    }
  }
});

module.exports = TreeRouter;
