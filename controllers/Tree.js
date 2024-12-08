const express = require('express');
const TreeService = require('../services/TreeService');
const TreeRouter = express.Router();
const {
  jwtMiddleware
} = require('../utils/middleware');

// PUBLIC GET TREE ROUTE
TreeRouter.get('/family-tree/:userId', async (req, res, next) => {
  try { 
    const { userId } = req.params;
    console.log("USER ID", userId);
    const result = await TreeService.getTree(userId);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
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
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

TreeRouter.patch('/accept-connection-request/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { gUserID } = req;
    const result = await TreeService.acceptConnectionRequest(gUserID, nodeId);
    console.log("RESULT", result);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

// ADD CHILD ROUTE
TreeRouter.post('/add-child', async (req, res, next) => {
  try {
    const { nodeId, childDetails } = req.body;
    const treeId = req.headers['x-tree-id'];
    const { gUserID } = req;
    if (!nodeId || !childDetails) {
      return { status: 400, message: 'Invalid request parameters' };
    }

    if (!treeId) {
      return { status: 400, message: 'Tree ID is required' };
    }

    const result = await TreeService.addChild(treeId, nodeId, childDetails, gUserID);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }

});

// UPDATE Person
TreeRouter.patch('/update-node/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const { body } = req;
    const result = await TreeService.updateNode(nodeId, body);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

// DELETE Person
TreeRouter.delete('/delete-node/:nodeId', async (req, res, next) => {
  try {
    const { nodeId } = req.params;
    const result = await TreeService.deleteNode(nodeId);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

// ADD PARENT ROUTE
TreeRouter.post('/add-parent', async (req, res, next) => {
  try {
    const { nodeId, parentDetails } = req.body;
    const treeId = req.headers['x-tree-id'];

    const { gUserID } = req;

    if (!treeId || !nodeId || !parentDetails) {
      return { status: 400, message: 'Invalid request parameters' };
    }

    if (!treeId) {
      return { status: 400, message: 'Tree ID is required' };
    }

    const result = await TreeService.addParent(treeId, nodeId, parentDetails, gUserID);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

// CHECK RELATIONSHIP ROUTE
TreeRouter.get('/check-relationship', async (req, res, next) => {
  try {
    const { referenceId, destinationId } = req.body;

    const result = await TreeService.checkRelationship(referenceId, destinationId);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = TreeRouter;
