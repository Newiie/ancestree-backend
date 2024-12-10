const mongoose = require('mongoose');
const PersonNode = require('../models/PersonNode');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors');
const PersonRepository = require('./PersonRepository');

class PersonNodeRepository {
  
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  static async setFamilyTree(id, familyTreeId) {
    if (!this.isValidObjectId(id)) {
      throw new InvalidObjectIdError('Invalid PersonNode ID');
    }
  
    const personNode = await PersonNode.findById(id);
    if (!personNode) {
      throw new NotFoundError('PersonNode not found');
    }
  
    personNode.familyTree = familyTreeId;
    await personNode.save();
  
    return personNode;
  }

  static async updatePersonNode(id, data) {
    if (!this.isValidObjectId(id)) {
      throw new InvalidObjectIdError('Invalid PersonNode ID');
    }
  
    // Find the PersonNode to get the associated Person ID
    const personNode = await PersonNode.findById(id);
    if (!personNode) {
      throw new NotFoundError('PersonNode not found');
    }
  
    const personId = personNode.person;
    if (!personId) {
      throw new NotFoundError('Person not associated with this node');
    }
  
    // Update the Person document
    const updatedPerson = await PersonRepository.findPersonAndUpdate(personId, data);
    console.log("UPDATED PERSON", updatedPerson);
    if (!updatedPerson) {
      throw new NotFoundError('Person not found');
    }
  
    return updatedPerson;
  }

  static async deletePersonNode(id) {
    if (!this.isValidObjectId(id)) {
      throw new InvalidObjectIdError('Invalid PersonNode ID');
    }
  
    const personNode = await PersonNode.findById(id);
    if (!personNode) {
      throw new NotFoundError('PersonNode not found');
    }
  
    const deleteNodeAndChildren = async (nodeId) => {
      const node = await PersonNode.findById(nodeId);
      if (node) {
        for (const childId of node.children) {
          await deleteNodeAndChildren(childId);
        }
        await PersonNode.findByIdAndDelete(nodeId);
      }
    };
  
    await deleteNodeAndChildren(id);
  
    return personNode;
  }

  static async getPersonNodeById(id, populateFields = []) {
    if (!this.isValidObjectId(id)) {
        throw new InvalidObjectIdError('Invalid PersonNode ID');
    }
    console.log("ID", id);
    
    let query = PersonNode.findById(id);
    populateFields.forEach(field => {
        query = query.populate(field);
    });

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
  console.log("PERSON ID", personId);

  // Prepare the query to find the PersonNode by personId
  let query = PersonNode.findOne({ person: personId });

  // Apply population for the specified fields
  populateFields.forEach(field => {
      query = query.populate(field);
  });

  // Execute the query
  const personNode = await query.exec();

  if (!personNode) {
      return null;
  }

  return personNode;
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
