const express = require('express');
const treeService = require('../services/treeService');
const treeRepository = require('../repositories/treeRepository'); // Ensure this is included for the check-relationship route
const treeRouter = express.Router();
const {
  jwtMiddleware
} = require('../utils/middleware');

treeRouter.use(jwtMiddleware);

// ADD CHILD ROUTE
treeRouter.post('/add-child', async (req, res, next) => {
  try {
    const { treeId, nodeId, childDetails } = req.body;

    if (!treeId || !nodeId || !childDetails) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }
  
    const result = await treeService.addChild(treeId, nodeId, childDetails);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }

});

// ADD PARENT ROUTE
treeRouter.post('/add-parent', async (req, res, next) => {
  try {
    const { treeId, nodeId, parentDetails } = req.body;

    if (!treeId || !nodeId || !parentDetails) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const result = await treeService.addParent(treeId, nodeId, parentDetails);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

// CHECK RELATIONSHIP ROUTE
treeRouter.get('/check-relationship', async (req, res, next) => {
  try {
    const { referenceId, destinationId } = req.query;

    if (!referenceId || !destinationId) {
      return res.status(400).json({ message: 'Invalid request parameters' });
    }

    const result = await treeService.checkRelationship(referenceId, destinationId);
    return res.status(result.status).json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = treeRouter;
