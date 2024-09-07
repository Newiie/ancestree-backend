// repositories/PersonNodeRepository.js
const mongoose = require('mongoose');
const PersonNode = require('../models/personNode');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

class PersonNodeRepository {

  static async getPersonNodeById(id, populateFields = []) {
    console.log("THIS IS THE ID", id)
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
  }

  static async createPersonNode(data) {
    const newNode = new PersonNode(data);
    return await newNode.save();
  }

  static async addParentToNode(node, parentId) {
    if (!isValidObjectId(parentId)) {
      throw new InvalidObjectIdError('Invalid Parent ID');
    }
    if (!node.parents.some(parent => parent._id.equals(parentId))) {
      node.parents.push(parentId);
      await node.save();
    }
  }

  static async addChildToNode(node, childId) {
    if (!isValidObjectId(childId)) {
      throw new InvalidObjectIdError('Invalid Child ID');
    }
    if (!node.children.some(child => child._id.equals(childId))) {
      node.children.push(childId);
      await node.save();
    }
  }
}

module.exports = PersonNodeRepository;
