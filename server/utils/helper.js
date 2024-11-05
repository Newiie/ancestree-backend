const mongoose = require('mongoose');
const multer = require('multer');

const upload = multer({ storage: multer.memoryStorage() });

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

module.exports = {
    isValidObjectId,
    upload
}