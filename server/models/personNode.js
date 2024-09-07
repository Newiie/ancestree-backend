const mongoose = require('mongoose');

const personNodeSchema = new mongoose.Schema({
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
  parents: {
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PersonNode' }],
    validate: {
      validator: function(v) {
        return v.length <= 2;
      },
      message: 'A person node can have no more than two parents.'
    }
  },
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PersonNode' }]
});

personNodeSchema.set('toJSON', {
  transform: function (doc, ret, options) {
    ret.personNodeId = ret._id;
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

const PersonNode = mongoose.model('PersonNode', personNodeSchema);

module.exports = PersonNode
