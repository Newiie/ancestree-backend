// repositories/UserRepository.js
const User = require('../models/user');

class UserRepository {
  static async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  static async getAllUsersWithFamilyTree() {
    // Populate familyTree and the root node, and for each PersonNode, populate person, parents, and children
    return await User.find({})
      .populate({
        path: 'familyTree',
        populate: {
          path: 'root', // This populates the rootNode inside familyTree
          populate: [
            { path: 'person' }, // Populate the person field in the PersonNode
            { path: 'parents', populate: { path: 'person' } }, // Populate parents and their person field
            { path: 'children', populate: { path: 'person' } } // Populate children and their person field
          ]
        }
      })
      .exec();
  }

  static async getAllUsers() {
    return await User.find({}).exec();
  }
}

module.exports = UserRepository;
