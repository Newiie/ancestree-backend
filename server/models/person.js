const mongoose = require('mongoose');

const personSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birthdate: Date,
  deathdate: Date,
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false }
});

personSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.personId = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Person = mongoose.model('Person', personSchema);

module.exports = Person
