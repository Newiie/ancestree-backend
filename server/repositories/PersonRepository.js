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
}

module.exports = PersonRepository;
