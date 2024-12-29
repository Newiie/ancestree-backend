const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: String,
  familyTree: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FamilyTree'
  },
  person: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Person'
  },
  friendRequest: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  progress: [{
    title: String,
    description: String,
    completed: {
      type: Boolean,
      default: false
    }
  }]
});

UserSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.userId = ret._id;
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  }
});

const User = mongoose.model('User', UserSchema);

module.exports = User;
