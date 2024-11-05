// repositories/FamilyTreeRepository.js
const mongoose = require('mongoose');
const FamilyTree = require('../models/FamilyTree');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors');

class FamilyTreeRepository {
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  static async getFamilyTreeById(id) {
    if (!this.isValidObjectId(id)) {
      throw new InvalidObjectIdError('Invalid FamilyTree ID');
    }
    const familyTree = await FamilyTree.findById(id);
    if (!familyTree) {
      throw new NotFoundError('FamilyTree not found');
    }
    return familyTree;
  }

  static async getFamilyTreeByUserId(userId) {
    if (!this.isValidObjectId(userId)) {
      throw new InvalidObjectIdError('Invalid User ID');
    }
    return await FamilyTree.findOne({ owner: userId }); 
  }

  static async createFamilyTree(data) {
    const familyTree = new FamilyTree(data);
    return await familyTree.save();
  }
}

module.exports = FamilyTreeRepository;
