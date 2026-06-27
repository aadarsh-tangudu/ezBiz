const mongoose = require("mongoose");

const FileAttachmentSchema = new mongoose.Schema({
  fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
  filename: String,
  contentType: String,
  size: Number
});

module.exports = FileAttachmentSchema;
