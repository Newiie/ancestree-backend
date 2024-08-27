const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birthdate: Date,
  deathdate: Date,
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});
const Person = mongoose.model('Person', personSchema);
module.exports = Person
