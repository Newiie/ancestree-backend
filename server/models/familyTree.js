const mongoose = require('mongoose');
 

const FamilyTreeSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  root: { type: mongoose.Schema.Types.ObjectId, ref: 'PersonNode' }
});

FamilyTreeSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.treeId = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const FamilyTree = mongoose.model('FamilyTree', FamilyTreeSchema);

module.exports = FamilyTree