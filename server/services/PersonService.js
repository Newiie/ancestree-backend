const PersonRepository = require('../repositories/PersonRepository');
const UserRepository = require('../repositories/UserRepository');
const { uploadToS3, getUrlImage } = require('../utils/aws.js');


const { isValidObjectId } = require('../utils/helper');

class PersonService {

    static async findPersons(personDetails) {
        try{
            console.log("PERSON DETAILS SERVICE", personDetails)
            const person = await PersonRepository.findPersonRelationship(personDetails);
            return person;
        } catch (error) {
            console.error("Error ", error);
        }
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

        const { treeId, personId, ...filteredPerson } = person.toJSON();
        return { ...filteredPerson, userId: user._id };
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

        await uploadToS3(file, "profilePicture", user.username);
        const imageUrl = await getUrlImage(`${user.username}-profilePicture`);
        const person = await PersonRepository.updateProfilePicture(user.person._id, imageUrl);

        return person;
    }

    static async updateBackgroundPicture(userId, backgroundPicture) {
        if (!isValidObjectId(userId)) {
            throw new Error('Invalid User ID');
        }
        const user = await UserRepository.findUserById(userId);

        await uploadToS3(backgroundPicture, "backgroundPicture", user.username);
        const imageUrl = await getUrlImage(`${user.username}-backgroundPicture`);

        const person = await PersonRepository.updateBackgroundPicture(user.person._id, imageUrl);
        return person;
    }
}

module.exports = PersonService;

