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
    
        const person = await PersonRepository.createPerson({
          name,
          birthdate: null,
          deathdate: null
        });
    
        const personNode = await PersonNodeRepository.createPersonNode({
          person: person._id,
          parents: [],
          children: []
        });
    
        const user = await UserRepository.createUser({
          username,
          name,
          passwordHash
        });
    
        const familyTree = await FamilyTreeRepository.createFamilyTree({
          root: personNode._id,
          owner: user._id
        });
    
        user.familyTree = familyTree._id;
        person.treeId = familyTree._id;
        await user.save();
        await person.save();
    
        return user;
    }

    static async getAllUsersWithRelations() {
        const users = await UserRepository.getAllUsersWithFamilyTree();
        
        const populatedUsers = await Promise.all(
          users.map(async (user) => {
            // const relations = await PersonNodeRepository.getPersonNodeById(user.familyTree.root, ['parents', 'children']);
            return {
              ...user.toJSON(),
              // relations: relations ? relations.toJSON() : null,
            };
          })
        );
        return populatedUsers;
    }
}

module.exports = UserService;
