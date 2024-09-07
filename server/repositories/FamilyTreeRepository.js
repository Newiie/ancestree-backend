// repositories/FamilyTreeRepository.js
const mongoose = require('mongoose');
const FamilyTree = require('../models/familyTree');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors');

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

class FamilyTreeRepository {
  static async getFamilyTreeById(id) {
    if (!isValidObjectId(id)) {
      throw new InvalidObjectIdError('Invalid FamilyTree ID');
    }
    const familyTree = await FamilyTree.findById(id);
    if (!familyTree) {
      throw new NotFoundError('FamilyTree not found');
    }
    return familyTree;
  }

  static async createFamilyTree(data) {
    const familyTree = new FamilyTree(data);
    return await familyTree.save();
  }
}

module.exports = FamilyTreeRepository;
