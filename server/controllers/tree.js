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

// ADD CHILD ROUTE
TreeRouter.post('/add-child', async (req, res, next) => {
  try {
    const { nodeId, childDetails } = req.body;
    const treeId = req.headers['x-tree-id'];
  
    if (!nodeId || !childDetails) {
      return { status: 400, message: 'Invalid request parameters' };
    }

    if (!treeId) {
      return { status: 400, message: 'Tree ID is required' };
    }

    const result = await TreeService.addChild(treeId, nodeId, childDetails);
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

    if (!treeId || !nodeId || !parentDetails) {
      return { status: 400, message: 'Invalid request parameters' };
    }

    if (!treeId) {
      return { status: 400, message: 'Tree ID is required' };
    }

    const result = await TreeService.addParent(treeId, nodeId, parentDetails);
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
