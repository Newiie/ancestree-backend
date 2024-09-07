const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  name: String,
  passwordHash: String,
  familyTree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyTree'
  }
});

userSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.userId = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});


const User = mongoose.model('User', userSchema);

module.exports = User;
