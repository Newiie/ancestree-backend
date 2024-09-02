const express = require('express');
const treeService = require('../services/treeService');
const treeRepository = require('../repositories/treeRepository'); // Ensure this is included for the check-relationship route
const treeRouter = express.Router();
const {jwtMiddleware} = require('../utils/middleware');

// treeRouter.use(jwtMiddleware);

// ADD CHILD ROUTE
treeRouter.post('/add-child', async (req, res) => {
  const { treeId, nodeId, childId } = req.body;

  if (!treeId || !nodeId || !childId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  const result = await treeService.addChild(treeId, nodeId, childId);
  return res.status(result.status).json(result);
});

// ADD PARENT ROUTE
treeRouter.post('/add-parent', async (req, res) => {
  const { treeId, nodeId, parentId } = req.body;

  if (!treeId || !nodeId || !parentId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  const result = await treeService.addParent(treeId, nodeId, parentId);
  // console.log("RES ", result)
  return res.status(result.status).json(result);
});

// CHECK RELATIONSHIP ROUTE
treeRouter.post('/check-relationship', async (req, res) => {
  const { referenceId, destinationId } = req.body;

  if (!referenceId || !destinationId) {
    return res.status(400).json({ message: 'Invalid request parameters' });
  }

  const result = await treeService.checkRelationship(referenceId, destinationId);
  return res.status(result.status).json(result);
});

module.exports = treeRouter;
