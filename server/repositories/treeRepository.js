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

const getPersonNodeByPersonId = async (personId, populateFields = []) => {
  if (!isValidObjectId(personId)) {
    throw new InvalidObjectIdError('Invalid Person ID');
  }

  // Initialize the query to find the PersonNode by person._id
  let query = PersonNode.findOne({ person: personId });

  // Apply population if any fields are provided.
  if (populateFields.length > 0) {
    populateFields.forEach(field => {
      query = query.populate(field);
    });
  }

  // Execute the query after setting up populates
  const personNode = await query.exec();

  // Check if personNode exists
  if (!personNode) {
    return null;
  }

  return personNode;
};


const getPersonNodeById = async (id, populateFields = []) => {
  if (!isValidObjectId(id)) {
    throw new InvalidObjectIdError('Invalid PersonNode ID');
  }

  // Initialize the query, but don't await it yet.
  let query = PersonNode.findById(id);

  // Apply population if any fields are provided.
  if (populateFields.length > 0) {
    populateFields.forEach(field => {
      query = query.populate(field);
    });
  }

  // Execute the query after setting up populates
  const personNode = await query.exec();

  // Check if personNode exists
  if (!personNode) {
    null
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
  getPersonNodeByPersonId,
};
