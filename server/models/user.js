const mongoose = require('mongoose')

const personSchema = new mongoose.Schema({
  name: String,
  birthdate: Date,
  deathdate: Date,
})

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: function() { return this.isRegistered; }  // Conditionally required
  },
  name: String,
  passwordHash: String,
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
});

userSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    delete returnedObject._id
    delete returnedObject.__v
    // the passwordHash should not be revealed
    delete returnedObject.passwordHash
  }
})

const User = mongoose.model('User', userSchema)
const Person = mongoose.model('Person', personSchema)

module.exports = { User, Person }
