const User = require('../server/models/Userser');
const { InvalidObjectIdError } = require('../utils/customErrors');
const { isValidObjectId } = require('../../utils/helper/helper');

class UserRepository {
  
  static async createUser(userData) {
    const user = new User(userData);
    return await user.save();
  }

  static async getFriendsFields(userId) {
    const user = await User.findById(userId, 'friendRequest friends')
      .populate({
        path: 'friends',
        populate: {
          path: 'person',
          select: 'generalInformation.firstName generalInformation.middleName generalInformation.lastName'
        }
      });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    const { friendRequest, friends } = user;
    return { friendRequest, friends };
  }

  static async findUserByUsername(username) {
    return await User.findOne({ username }).exec();
  }

  static async findUserById(userId) {
    if (!isValidObjectId(userId)) {
      throw new InvalidObjectIdError('Invalid User ID');
    }
    return await User.findById(userId);
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
