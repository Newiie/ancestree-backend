const mongoose = require('mongoose');

const UpdateSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: [
      'FAMILY_MEMBER_ADDED', 
      'CONNECTION_FOUND', 
      'RECORDS_UPLOADED', 
      'PHOTOS_ADDED', 
      'TREE_UPDATED',
      'NOTIFICATION_RECEIVED'
    ],
    required: true
  },
  details: {
    type: String,
    required: true
  },
  count: {
    type: Number,
    default: 1
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '30d' // Automatically delete after 30 days
  }
});

const Update = mongoose.model('Update', UpdateSchema);

module.exports = Update;
