const mongoose = require('mongoose');
const FamilyTree = require('../server/models/FamilyTreeree');
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
  
    // Reusable population config for 'person'
    const personPopulation = {
      path: 'person',
      select: '-address -interests -vitalInformation -emergencyContact -aboutMe -quotes',
    };
  
    // Recursive population config for 'children' and 'parents'
    const populateRelations = (depth = 4) => {
      if (depth === 0) return [];
      return [
        {
          path: 'children',
          populate: [
            ...populateRelations(depth - 1), // Recursively populate children
            personPopulation, // Populate 'person'
          ],
        },
        personPopulation, // Populate 'person' at this level
      ];
    };
  
    return await FamilyTree.findOne({ owner: userId }).populate({
      path: 'root',
      populate: populateRelations(5), // Adjust depth as needed
    });
  }

  static async createFamilyTree(data) {
    const familyTree = new FamilyTree(data);
    return await familyTree.save();
  }
}

module.exports = FamilyTreeRepository;
