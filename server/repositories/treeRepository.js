const FamilyTree = require('../models/familyTree');
const PersonNode = require('../models/personNode');

const getFamilyTreeById = async (id) => {
  return await FamilyTree.findById(id);
};

const getPersonNodeById = async (id, populateFields = []) => {
  let query = PersonNode.findById(id);
  populateFields.forEach(field => query = query.populate(field));
  return await query.exec();
};

const createPersonNode = async (data) => {
  const newNode = new PersonNode(data);
  return await newNode.save();
};

const addParentToNode = async (node, parentId) => {
  if (!node.parents.some(parent => parent._id.equals(parentId))) {
    node.parents.push(parentId);
    await node.save();
  }
};

const addChildToNode = async (node, childId) => {
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
