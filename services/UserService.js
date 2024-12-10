const bcrypt = require('bcrypt');
const UserRepository = require('../repositories/UserRepository');
const PersonService = require('./PersonService');
const PersonNodeService = require('./PersonNodeService');
const FamilyTreeService = require('./TreeService');

class UserService {
    static async createUser(firstName, lastName, username, password) {
        if (!username || !password) {
            throw new Error('Username and password are required');
        }

        if (!firstName || !lastName) {
            throw new Error('firstname and lastname are required');
        }

        const existingUser = await UserRepository.findUserByUsername(username);
        if (existingUser) {
            throw new Error('Username is already taken');
        }
    
        const passwordHash = await bcrypt.hash(password, 10);
        
        const user = await UserRepository.createUser({
            username,
            passwordHash
        });

        const person = await PersonService.createPerson({
            generalInformation: {
                firstName,
                lastName
            },
            relatedUser: user._id
        });
 
        const personNode = await PersonNodeService.createPersonNode({
            person: person._id,
            parents: [],
            children: []
        });
    
        const familyTree = await FamilyTreeService.createFamilyTree(
            user._id
        );

        await FamilyTreeService.addRoot(familyTree._id, personNode._id);
        await PersonNodeService.setFamilyTree(personNode._id, familyTree._id);
        await UserRepository.setFamilyTree(user._id, familyTree._id);
        await UserRepository.setPerson(user._id, person._id);
    
        return user;
    }
}

module.exports = UserService;
