const PersonRepository = require('../repositories/PersonRepository');
const UserRepository = require('../repositories/UserRepository');

const { isValidObjectId } = require('../utils/helper');

class PersonService {
    static async getPersonByUserId(userId) {
        if (!userId) {
            throw new Error('User ID is required');
        }

        if (!isValidObjectId(userId)) {
            throw new Error('Invalid User ID');
        }

        const user = await UserRepository.findUserById(userId);
        const person = await PersonRepository.getPersonById(user.person._id);

        const { treeId, personId, ...filteredPerson } = person.toJSON();
        return { ...filteredPerson, userId: user._id };
    }

    static async updatePerson(personId, update) {
        if (!isValidObjectId(personId)) {
            throw new Error('Invalid Person ID');
        }

        await PersonRepository.updatePerson(personId, update);
        const person = await PersonRepository.getPersonById(personId);
        console.log("UPDATED PERSON",person);
        return { status: 200, message: "Person updated successfully" };
    }

    static async updateProfilePicture(userId, profilePicture) {
        if (!isValidObjectId(userId)) {
            throw new Error('Invalid User ID');
        }

        const user = await UserRepository.findUserById(userId);

        const person = await PersonRepository.updateProfilePicture(user.person._id, profilePicture);
        return person;
    }

    static async updateBackgroundPicture(userId, backgroundPicture) {
        if (!isValidObjectId(userId)) {
            throw new Error('Invalid User ID');
        }
        const user = await UserRepository.findUserById(userId);
        const person = await PersonRepository.updateBackgroundPicture(user.person._id, backgroundPicture);
        return person;
    }
}

module.exports = PersonService;

