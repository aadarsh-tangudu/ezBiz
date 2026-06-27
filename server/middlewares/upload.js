const multer = require("multer");
const { GridFsStorage } = require("multer-gridfs-storage");
const mongoose = require("mongoose");

const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/ezbiz";

// Initialize GridFS bucket on db connected
let bucket;
mongoose.connection.on("connected", () => {
  bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "attachments"
  });
});

// Configure Multer-GridFS engine
const storage = new GridFsStorage({
  url: mongoURI,
  options: { useUnifiedTopology: true },
  file: (req, file) => {
    return {
      bucketName: "attachments",
      filename: `${Date.now()}_${file.originalname}`
    };
  }
});

const upload = multer({ storage });

module.exports = {
  upload,
  getBucket: () => bucket
};
