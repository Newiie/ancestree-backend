// repositories/UserRepository.js
const User = require('../models/user');

class UserRepository {
  static async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  static async getAllUsersWithFamilyTree() {
    // Populate familyTree and rootNode in a single query
    return await User.find({})
      .populate({
        path: 'familyTree',
        populate: { path: 'root' } // This will populate the rootNode inside familyTree
      })
      .exec();
  }

  static async getAllUsers() {
    return await User.find({}).exec();
  }
}

module.exports = UserRepository;
