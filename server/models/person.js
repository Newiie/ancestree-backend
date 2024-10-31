const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
  name: { type: String, required: true },
  birthdate: Date,
  deathdate: Date,
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyTree', required: false} 
});

PersonSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.personId = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const Person = mongoose.model('Person', PersonSchema);

module.exports = Person
