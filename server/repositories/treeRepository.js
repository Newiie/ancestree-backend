const mongoose = require('mongoose');
const FamilyTree = require('../models/familyTree');
const PersonNode = require('../models/personNode');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors'); 

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getFamilyTreeById = async (id) => {
  if (!isValidObjectId(id)) {
    throw new InvalidObjectIdError('Invalid FamilyTree ID');
  }
  const familyTree = await FamilyTree.findById(id);
  if (!familyTree) {
    throw new NotFoundError('FamilyTree not found');
  }
  return familyTree;
};

const getPersonNodeById = async (id, populateFields = []) => {
  if (!isValidObjectId(id)) {
    throw new InvalidObjectIdError('Invalid PersonNode ID');
  }
  let query = PersonNode.findById(id);
  populateFields.forEach(field => query = query.populate(field));
  const personNode = await query.exec();
  if (!personNode) {
    throw new NotFoundError('PersonNode not found');
  }
  return personNode;
};

const createPersonNode = async (data) => {
  const newNode = new PersonNode(data);
  return await newNode.save();
};

const addParentToNode = async (node, parentId) => {
  if (!isValidObjectId(parentId)) {
    throw new InvalidObjectIdError('Invalid Parent ID');
  }
  if (!node.parents.some(parent => parent._id.equals(parentId))) {
    node.parents.push(parentId);
    await node.save();
  }
};

const addChildToNode = async (node, childId) => {
  if (!isValidObjectId(childId)) {
    throw new InvalidObjectIdError('Invalid Child ID');
  }
  if (!node.children.some(child => child._id.equals(childId))) {
    node.children.push(childId);
    await node.save();
  }
};

module.exports = {
  getFamilyTreeById,
  getPersonNodeById,
  createPersonNode,
  addParentToNode,
  addChildToNode,
};
