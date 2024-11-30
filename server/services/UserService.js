// services/UserService.js
const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/UserRepository');
const PersonRepository = require('../repositories/PersonRepository');
const PersonNodeRepository = require('../repositories/PersonNodeRepository');
const FamilyTreeRepository = require('../repositories/FamilyTreeRepository');

class UserService {

    static async createUser(firstName, lastName, username, password) {
        if (!username || !password) {
          throw new Error('Username and password are required');
        }

        if (!firstName || !lastName) {
          console.log("FIRST NAME", firstName); 
          console.log("LAST NAME", lastName);
          throw new Error('firstname and lastname are required');
        }

        const existingUser = await UserRepository.findUserByUsername(username);
        if (existingUser) {
          throw new Error('Username is already taken');
        }
    
        const passwordHash = await bcrypt.hash(password, 10);
        
        console.log('firstName', firstName);
        console.log('lastName', lastName);
        const user = await UserRepository.createUser({
          username,
          passwordHash
        });

        const person = await PersonRepository.createPerson({
          generalInformation: {
            firstName,
            lastName
          },
            relatedUser: user._id,
            birthdate: null,
            deathdate: null
        });
 
        const personNode = await PersonNodeRepository.createPersonNode({
          person: person._id,
          parents: [],
          children: [],
        });
    
        const familyTree = await FamilyTreeRepository.createFamilyTree({
          root: personNode._id,
          owner: user._id
        });

      
        personNode.familyTree = familyTree._id;
        user.familyTree = familyTree._id;
        user.person = person._id;
        person.treeId = familyTree._id;
        await personNode.save();
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
