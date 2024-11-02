// repositories/UserRepository.js
const User = require('../models/User');

class UserRepository {
  
  static async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  static async findUserByUsername(username) {
    return await User.findOne({ username }).exec();
  }

  static async getAllUsersWithFamilyTree() {
    return await User.find({})
      .populate({
        path: 'familyTree',
        populate: {
          path: 'root',
          populate: [
            { path: 'person' },
            { path: 'parents', populate: { path: 'person' } },
            { path: 'children', populate: { path: 'person' } }
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
