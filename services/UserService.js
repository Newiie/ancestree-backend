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
            passwordHash,
            progress: [
                {
                    title: "Update profile details",
                    description: "Complete your profile with personal information and customize your app settings.",
                    completed: false
                },
                {
                    title: "Create your first Family Tree",
                    description: "Start building your family tree by adding members and exploring potential connections.",
                    completed: false
                },
                {
                    title: "Search for relatives using the Relationships tool",
                    description: "Use advanced search options to find and connect with relatives through detailed filters.",
                    completed: false
                },
                {
                    title: "View search results and connect with relatives",
                    description: "Explore potential matches in the results display and integrate them into your family tree.",
                    completed: false
                },
                {
                    title: "Upload and manage your family records",
                    description: "Keep all essential documents and family records organized and accessible in one place.",
                    completed: false
                },
                {
                    title: "Add family photos to the Gallery",
                    description: "Upload and organize family photos to create a visual representation of your family history.",
                    completed: false
                },
                {
                    title: "Stay informed with Notifications",
                    description: "Receive alerts and updates on new family connections and changes in your family tree.",
                    completed: false
                }
            ]
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

    static async getUserById(userId) {
        const user = await UserRepository.findUserById(userId);
        return user;
    }
}

module.exports = UserService;
