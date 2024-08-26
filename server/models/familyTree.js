const mongoose = require('mongoose');

const familyTreeSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  root: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonNode' }
});

const FamilyTree = mongoose.model('FamilyTree', familyTreeSchema);

module.exports = FamilyTree