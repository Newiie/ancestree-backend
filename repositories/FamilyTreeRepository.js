const mongoose = require('mongoose');
const FamilyTree = require('../models/FamilyTree');
const { InvalidObjectIdError, NotFoundError } = require('../utils/customErrors');

class FamilyTreeRepository {
  
  static isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
  }

  static async updateFamilyTreeRoot(treeId, parentNodeId) {
    if (!this.isValidObjectId(treeId)) {
      throw new InvalidObjectIdError('Invalid FamilyTree ID');
    }
    const familyTree = await FamilyTree.findById(treeId);
    if (!familyTree) {
      throw new NotFoundError('FamilyTree not found');
    }
    familyTree.root = parentNodeId;
    
    return await familyTree.save();
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
  
    // Reusable population config for 'person'
    const personPopulation = {
      path: 'person',
      select: '-address -interests -emergencyContact -aboutMe -quotes',
    };
  
    // Recursive population config for 'children' and 'parents'
    const populateRelations = (depth = 8) => {
      if (depth === 0) return [];
      return [
        {
          path: 'children',
          populate: [
            ...populateRelations(depth - 1),
            personPopulation, 
          ],
        },
        {
          path: 'parents',
          populate: [
            personPopulation
          ],
        },
        personPopulation, 
      ];
    };
  
    return await FamilyTree.findOne({ owner: userId }).populate({
      path: 'root',
      populate: populateRelations(8), 
    });
  }

  static async createFamilyTree(data) {
    const familyTree = new FamilyTree(data);
    return await familyTree.save();
  }
}

module.exports = FamilyTreeRepository;
