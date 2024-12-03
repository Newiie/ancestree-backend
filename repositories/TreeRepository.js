const FamilyTree = require('../server/models/FamilyTreeree');
const PersonNode = require('../server/models/PersonNodeode');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors'); 
const { isValidObjectId } = require('../../utils/helper/helper');

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

const getFamilyTreeByUserId = async (userId) => {
  if (!isValidObjectId(userId)) {
    throw new InvalidObjectIdError('Invalid User ID');
  }
  const familyTree = await FamilyTree.findOne({ user: userId });
  if (!familyTree) {
    return null;
  }
  return familyTree;
};

const findPersonInTree = async (treeId, personDetails) => {
  const { firstname, lastname, birthdate, deathdate } = personDetails;
  const personNode = await PersonNode.findOne({
    familyTree: treeId,
    'person.firstname': firstname,
    'person.lastname': lastname,
    'person.birthdate': birthdate,
    'person.deathdate': deathdate
  }).populate('person');
  return personNode ? personNode.person : null;
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

const findOrCreatePerson = async (personDetails) => {
  let person = await Person.findOne(personDetails);
  if (!person) {
    person = await Person.create(personDetails);
  }
  return person;
};

module.exports = {
  getFamilyTreeById,
  createPersonNode,
  addParentToNode,
  addChildToNode,
  getPersonNodeByPersonId,
  getFamilyTreeByUserId,
  findPersonInTree,
  findOrCreatePerson,
};
