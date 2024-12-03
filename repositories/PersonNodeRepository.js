const mongoose = require('mongoose');
const PersonNode = require('../server/models/PersonNodeode');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors');
const PersonRepository = require('./PersonRepository');

class PersonNodeRepository {
  
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
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
  
    // Assuming personNode has a reference to Person as 'person'
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
  
    // Find the node to be deleted
    const personNode = await PersonNode.findById(id);
    if (!personNode) {
      throw new NotFoundError('PersonNode not found');
    }
  
    // Recursive function to delete a node and its children
    const deleteNodeAndChildren = async (nodeId) => {
      const node = await PersonNode.findById(nodeId);
      if (node) {
        // Delete all children of the current node
        for (const childId of node.children) {
          await deleteNodeAndChildren(childId);
        }
        // Delete the current node
        await PersonNode.findByIdAndDelete(nodeId);
      }
    };
  
    // Start the deletion process with the root node
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

    // Find the PersonNode by personId
    let personNode = await PersonNode.findOne({ 'person': personId });
    if (!personNode) {
      return null;
    }

    // Populate the specified fields
    populateFields.forEach(field => {
      personNode = personNode.populate(field);
    });

    // Execute the query
    personNode = await personNode.execPopulate();

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
