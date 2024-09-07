// services/UserService.js
const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/UserRepository');
const PersonRepository = require('../repositories/PersonRepository');
const PersonNodeRepository = require('../repositories/PersonNodeRepository');
const FamilyTreeRepository = require('../repositories/FamilyTreeRepository');

class UserService {
    static async createUser(username, name, password) {
        if (!username || !password) {
          throw new Error('Username and password are required');
        }
    
        const passwordHash = await bcrypt.hash(password, 10);
    
        // Create the Person document for the new user
        const person = await PersonRepository.createPerson({
          name,
          birthdate: null,
          deathdate: null
        });
    
        // Create the PersonNode for the new user
        const personNode = await PersonNodeRepository.createPersonNode({
          person: person._id, // Use the newly created Person's ID
          parents: [],
          children: []
        });
    
        // Create and save the user
        const user = await UserRepository.createUser({
          username,
          name,
          passwordHash
        });
    
        // Create FamilyTree and assign the user as the owner and root node
        const familyTree = await FamilyTreeRepository.createFamilyTree({
          root: personNode._id,
          owner: user._id // Set the user as the owner of the family tree
        });
    
        // Update user with the created family tree
        user.familyTree = familyTree._id;
        await user.save();
    
        return user;
      }

  static async getAllUsersWithRelations() {
    const users = await UserRepository.getAllUsersWithFamilyTree();
    
    const populatedUsers = await Promise.all(
      users.map(async (user) => {
        console.log("USER ", user)
        const relations = await PersonNodeRepository.getPersonNodeById(user.familyTree.root, ['parents', 'children']);
        return {
          ...user.toJSON(),
          relations: {
            ...relations.toJSON(), // relations.toJSON() triggers the transformation for PersonNode
          },
        };
      })
    );
    return populatedUsers;
  }
}

module.exports = UserService;
