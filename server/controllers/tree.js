const express = require('express');
const TreeService = require('../services/TreeService');
const treeRepository = require('../repositories/TreeRepository'); // Ensure this is included for the check-relationship route
const TreeRouter = express.Router();
const {
  jwtMiddleware
} = require('../utils/middleware');

TreeRouter.use(jwtMiddleware);

// ADD CHILD ROUTE
TreeRouter.post('/add-child', async (req, res, next) => {
  try {
    const { treeId, nodeId, childDetails } = req.body;

    if (!treeId || !nodeId || !childDetails) {
      return res.status(400).json({ message: 'Invalid request parameters' });
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
    const { treeId, nodeId, parentDetails } = req.body;

    if (!treeId || !nodeId || !parentDetails) {
      return res.status(400).json({ message: 'Invalid request parameters' });
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
    const { referenceId, destinationId } = req.query;

    if (!referenceId || !destinationId) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const result = await TreeService.checkRelationship(referenceId, destinationId);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = TreeRouter;
