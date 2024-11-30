// repositories/PersonRepository.js
const Person = require('../models/Person');
const PersonNode = require('../models/PersonNode');
const UserRepository = require('./UserRepository');

class PersonRepository {
   // Method to create a Person document
  static async createPerson(personData) {
    const person = new Person(personData);
    return await person.save();
  }

  static async findPersonRelationship(personDetails) {
    console.log("FIND SIMLAR PERSONS ", personDetails);
    const { firstName, middleName, lastName, birthdate } = personDetails;
    // Construct the query object
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
  
    // Fetch associated PersonNodes for each Person
    const results = await Promise.all(
      persons.map(async (person) => {
        const personNode = await PersonNode.findOne({ person: person._id }).populate('familyTree');
        const user = await UserRepository.findUserById(personNode.familyTree.owner);
        const personDetails = {
          userId : user._id,
          firstName : person.generalInformation.firstName,
          middleName : person.generalInformation.middleName,
          lastName : person.generalInformation.lastName,
          nodeId : personNode._id
        }
        return personDetails;
      })
    );
  
    return results;
  }
  

  static async getUserRelations(userId) {
    return await Person.find({ relatedUser: userId })
      .select('name birthdate deathdate relatedUser')
      .lean();
  }

  static async findPersonAndUpdate(personId, update) {
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async findOrCreatePerson(personDetails) {
    let person = await Person.findOne(personDetails);
    if (!person) {
      person = await this.createPerson(personDetails);
    }
    return person;
  }

  static async findSimilarPersons(personDetails) {
    const { name, birthdate, deathdate } = personDetails;
    return await Person.find({
      name: { $regex: new RegExp(name, 'i') }, // Case-insensitive name match
      birthdate: birthdate ? birthdate : { $exists: true },
      deathdate: deathdate ? deathdate : { $exists: true }
    }).lean();
  }

  static async getPersonById(personId) {
    return await Person.findById(personId);
  }

  static async updatePerson(personId, update) {
    return await Person.findByIdAndUpdate(personId, { $set: update }, { new: true });
  }

  static async updatePersonGeneralInformation(personId, generalInfo) {
    console.log("GENERAL INFO", generalInfo)
    const update = Object.keys(generalInfo).reduce((acc, key) => {
        acc[`generalInformation.${key}`] = generalInfo[key];
        return acc;
    }, {});
    console.log("UPDATE", update)
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
