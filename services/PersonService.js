const PersonRepository = require('../repositories/PersonRepository');
const UserRepository = require('../repositories/UserRepository');
const ImageService = require('./ImageService');
const { isValidObjectId } = require('mongoose');

class PersonService {

    static async createPerson(personDetails) {
        const person = await PersonRepository.createPerson(personDetails);
        return person;
    }

    static async setFamilyTree(personId, familyTreeId) {
        if (!isValidObjectId(personId) || !isValidObjectId(familyTreeId)) {
            throw new Error('Invalid Person or Family Tree ID');
        }
        const person = await PersonRepository.setFamilyTree(personId, familyTreeId);
        return person;
    }

    static async findPersons(personDetails) {
        const persons = await PersonRepository.findPersonRelationship(personDetails);
        console.log("PERSONS", persons);
        const personsWithImages = await Promise.all(
            persons.map(async (person) => ({
                ...person,
                profilePicture: person.profilePicture 
                    ? await ImageService.getImageUrl(person.profilePicture) 
                    : "/images/doge.png"
            }))
        );
        return personsWithImages;
    }

    static async getPersonByUserId(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!isValidObjectId(userId)) {
            throw new Error('Invalid User ID');
        }

        const user = await UserRepository.findUserById(userId);
        const person = await PersonRepository.getPersonById(user.person._id);
        const friendsList = user.friends;
        const friendRequestList = user.friendRequest;

        const { treeId, personId, ...filteredPerson } = person.toJSON();
        return { 
            ...filteredPerson, 
            userId: user._id, 
            friendsList,
            friendRequestList
         };
    }

    static async updateRelatedUser(personId, userId) {
        if (!isValidObjectId(personId) || !isValidObjectId(userId)) {
            throw new Error('Invalid Person or User ID');
        }
        const person = await PersonRepository.updateRelatedUser(personId, userId);
        return person;
    }

    static async updatePerson(personId, update) {
        if (!isValidObjectId(personId)) {
            throw new Error('Invalid Person ID');
        }
        console.log("PERSON ID", personId);
        await PersonRepository.updatePerson(personId, update);
        const person = await PersonRepository.getPersonById(personId);
        console.log("UPDATED PERSON",person);
        return { status: 200, message: "Person updated successfully" };
    }

    static async updateProfilePicture(userId, file) {
        if (!isValidObjectId(userId)) {
            throw new Error('Invalid User ID');
        }

        const user = await UserRepository.findUserById(userId);
        const imageUrl = await ImageService.uploadProfilePicture(file, user.username);
        const person = await PersonRepository.updateProfilePicture(user.person._id, imageUrl);

        return person;
    }

    static async updateBackgroundPicture(userId, backgroundPicture) {
        if (!isValidObjectId(userId)) {
            throw new Error('Invalid User ID');
        }
        const user = await UserRepository.findUserById(userId);

        const imageUrl = await ImageService.uploadBackgroundPicture(backgroundPicture, user.username);
        const person = await PersonRepository.updateBackgroundPicture(user.person._id, imageUrl);
        return person;
    }
}

module.exports = PersonService;
