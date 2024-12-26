const mongoose = require('mongoose');

const AlbumSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    photos: [{
        type: String  
    }],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const RecordSchema = new mongoose.Schema({
    albums: [AlbumSchema],
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

RecordSchema.set('toJSON', {
    transform: function (doc, ret, options) {
        ret.recordId = ret._id;
        delete ret._id;
        delete ret.__v;
        return ret;
    }
});

const Record = mongoose.model('Record', RecordSchema);

module.exports = Record;