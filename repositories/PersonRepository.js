// repositories/PersonRepository.js
const Person = require('../models/Person');
const PersonNode = require('../models/PersonNode');
const UserRepository = require('./UserRepository');

class PersonRepository {
  static async createPerson(personData) {
    const person = new Person(personData);
    return await person.save();
  }

  static async setFamilyTree(personId, familyTreeId) {
    return await Person.findByIdAndUpdate(personId, { $set: { treeId: familyTreeId } }, { new: true });
  }

  static async findPersonRelationship(personDetails) {
    console.log("FIND SIMILAR PERSONS ", personDetails);
    const { firstName, middleName, lastName, birthdate } = personDetails;
  
    const query = {
      'generalInformation.firstName': firstName,
      'generalInformation.lastName': lastName,
    };
    if (middleName) query['generalInformation.middleName'] = middleName;
    if (birthdate) query['generalInformation.birthdate'] = birthdate;
  
    // Execute the query to find all matching Persons
    const persons = await Person.find(query);
    console.log("PERSONS FOUND", persons);
  
    if (!persons.length) return []; // No matches found
  
    // Fetch associated PersonNodes and filter unique results by userId
    const resultSet = new Map();
  
    for (const person of persons) {
      try {
        const personNode = await PersonNode.findOne({ person: person._id }).populate('familyTree');
        if (!personNode || !personNode.familyTree) continue;
  
        const user = await UserRepository.findUserById(personNode.familyTree.owner);
        if (!user || !user.person) continue;
  
        const account = await Person.findOne({ _id: user.person._id.toString() });
        if (!account) continue;
  
        const personDetails = {
          userId: user._id.toString(),
          firstName: account.generalInformation.firstName,
          middleName: account.generalInformation.middleName,
          lastName: account.generalInformation.lastName,
          profilePicture: account.profilePicture,
        };
  
        // Use userId as the key to ensure uniqueness
        resultSet.set(personDetails.userId, personDetails);
      } catch (error) {
        console.error("Error fetching person relationships:", error);
      }
    }
  
    // Convert the Map back to an array of unique values
    return Array.from(resultSet.values());
  }
  
  static async updateRelatedUser(personId, userId) {
    return await Person.findByIdAndUpdate(personId, { $set: { relatedUser: userId } }, { new: true });
  }

  static async getUserRelations(userId) {
    return await Person.find({ relatedUser: userId })
      .select('name birthdate deathdate relatedUser')
      .lean();
  }

  static async findPersonAndUpdate(personId, update) {
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async findSimilarPersons(personDetails) {
    const { 
      generalInformation: { 
        firstName, 
        lastName 
      }
    } = personDetails;
    const exactMatch = await Person.findOne({
      'generalInformation.firstName': firstName,
      'generalInformation.lastName': lastName
    });
    console.log("Exact Match:", exactMatch);
  
    if (!firstName || !lastName) {
      throw new Error('First name and last name are required.');
    }

    return await Person.find({
      'generalInformation.firstName': { $regex: new RegExp(firstName, 'i') },
      'generalInformation.lastName': { $regex: new RegExp(lastName, 'i') }
    }).lean();
  }
  

  static async getPersonById(personId) {
    return await Person.findById(personId);
  }

  static async updatePerson(personId, update) {
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async updatePersonGeneralInformation(personId, generalInfo) {
    const update = Object.keys(generalInfo).reduce((acc, key) => {
        acc[`generalInformation.${key}`] = generalInfo[key];
        return acc;
    }, {});
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async updateAddress(personId, addressData) {
    const update = Object.keys(addressData).reduce((acc, key) => {
        acc[`address.${key}`] = addressData[key];
        return acc;
    }, {});
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async updateVitalInformation(personId, vitalInfo) {
    const update = Object.keys(vitalInfo).reduce((acc, key) => {
        acc[`vitalInformation.${key}`] = vitalInfo[key];
        return acc;
    }, {});
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async updateInterests(personId, interestsData) {
    return await Person.findByIdAndUpdate(personId, { $set: { interests: interestsData } }, { new: true });
  }

  static async updateEmergencyContact(personId, emergencyContactData) {
    const update = Object.keys(emergencyContactData).reduce((acc, key) => {
        acc[`emergencyContact.${key}`] = emergencyContactData[key];
        return acc;
    }, {});
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async updateProfilePicture(personId, profilePicture) {
    return await Person.findByIdAndUpdate(personId, { $set: { profilePicture: profilePicture } }, { new: true });
  }

  static async updateBackgroundPicture(personId, backgroundPicture) {
    return await Person.findByIdAndUpdate(personId, { $set: { backgroundPicture: backgroundPicture } }, { new: true });
  }
}

module.exports = PersonRepository;
