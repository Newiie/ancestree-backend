// repositories/PersonRepository.js
const Person = require('../models/person');

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
}

module.exports = PersonRepository;
