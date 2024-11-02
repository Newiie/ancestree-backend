// repositories/PersonRepository.js
const Person = require('../models/Person');

class PersonRepository {
   // Method to create a Person document
  static async createPerson(personData) {
    const person = new Person(personData);
    return await person.save();
  }

  static async getUserRelations(userId) {
    return await Person.find({ relatedUser: userId })
      .select('name birthdate deathdate relatedUser')
      .lean();
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
}

module.exports = PersonRepository;
