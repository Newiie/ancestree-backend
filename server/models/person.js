const mongoose = require('mongoose');

const PersonSchema = new mongoose.Schema({
  generalInformation: {
    firstname: { type: String, required: true },
    middleName: String,
    lastname: { type: String, required: true },
    suffix: String,
    email: String,
    phone: String,
    birthdate: Date,
    deathdate: Date,
    birthPlace: String,
    birthingCenter: String,
    nationality: String,
    civilStatus: String
  },
  address: {
    streetAddress: String,
    city: String,
    province: String,
    country: String,
    zipCode: String,
  },
  vitalInformation: {
    sex: String,
    height: String,
    weight: String,
    eyeColor: String,
    hairColor: String,
    bloodType: String
  },
  interests: [{
    title: String,
    description: String
  }],
  emergencyContact: {
    name: String,
    phone: String,
    relationship: String
  },
  relatedUser: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  treeId: { type: mongoose.Schema.Types.ObjectId, ref: 'FamilyTree', required: false},
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
