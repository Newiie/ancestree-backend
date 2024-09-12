// repositories/PersonNodeRepository.js
const mongoose = require('mongoose');
const PersonNode = require('../models/personNode');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors');
const PersonRepository = require('./PersonRepository');

class PersonNodeRepository {
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  static async getPersonNodeById(id, populateFields = []) {
    if (!this.isValidObjectId(id)) {
      throw new InvalidObjectIdError('Invalid PersonNode ID');
    }
    let query = PersonNode.findById(id);
    populateFields.forEach(field => query = query.populate(field));
    const personNode = await query.exec();
    if (!personNode) {
      throw new NotFoundError('PersonNode not found');
    }
    return personNode;
  }

  static async getPersonNodeByPersonId(personId, populateFields = []) {
    if (!this.isValidObjectId(personId)) {
      throw new InvalidObjectIdError('Invalid Person ID');
    }
    let query = PersonNode.findOne({ person: personId });
    populateFields.forEach(field => query = query.populate(field));
    return await query.exec();
  }

  static async createPersonNode(data) {
    const newNode = new PersonNode(data);
    return await newNode.save();
  }

  static async addParentToNode(node, parentId) {
    if (!this.isValidObjectId(parentId)) {
      throw new InvalidObjectIdError('Invalid Parent ID');
    }
    if (!node.parents.some(parent => parent._id.equals(parentId))) {
      node.parents.push(parentId);
      await node.save();
    }
  }

  static async addChildToNode(node, childId) {
    if (!this.isValidObjectId(childId)) {
      throw new InvalidObjectIdError('Invalid Child ID');
    }
    if (!node.children.some(child => child._id.equals(childId))) {
      node.children.push(childId);
      await node.save();
    }
  }

  static async findPersonInTree(treeId, personDetails) {
    const { name, birthdate, deathdate } = personDetails;
    return await PersonNode.findOne({
      familyTree: treeId,
      'person.name': name,
      'person.birthdate': birthdate,
      'person.deathdate': deathdate
    }).populate('person');
  }

  static async findSimilarPersonsInTree(treeId, personDetails) {
    const similarPersons = await PersonRepository.findSimilarPersons(personDetails);
    return await PersonNode.find({
      'person._id': { $in: similarPersons.map(person => person._id) },
      familyTree: treeId
    }).populate('person');
  }
}

module.exports = PersonNodeRepository;
