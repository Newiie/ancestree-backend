const mongoose = require('mongoose');

const personNodeSchema = new mongoose.Schema({
  person: { type: mongoose.Schema.Types.ObjectId, ref: 'Person' },
  parents: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PersonNode' }],
  children: [{ type: mongoose.Schema.Types.ObjectId, ref: 'PersonNode' }]
});

const PersonNode = mongoose.model('PersonNode', personNodeSchema);

module.exports = PersonNode
