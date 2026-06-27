const mongoose = require("mongoose");
const { getBucket } = require("../middlewares/upload");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Expense = require("../models/Expense");

const uploadAttachment = (Model, paramIdName) => async (req, res) => {
  try {
    const docId = req.params[paramIdName];
    const fileType = req.query.type; // "billFile" or "receiptFile"

    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const attachmentMetadata = {
      fileId: req.file.id,
      filename: req.file.filename,
      contentType: req.file.contentType,
      size: req.file.size
    };

    const updatedDoc = await Model.findOneAndUpdate(
      { _id: docId, userId: req.user.id },
      { $set: { [fileType]: attachmentMetadata } },
      { new: true }
    );

    if (!updatedDoc) return res.status(404).json({ error: "Document not found" });

    return res.json(updatedDoc);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const removeAttachment = (Model, paramIdName) => async (req, res) => {
  try {
    const docId = req.params[paramIdName];
    const fileType = req.query.type; // "billFile" or "receiptFile"

    const doc = await Model.findOne({ _id: docId, userId: req.user.id });
    if (!doc) return res.status(404).json({ error: "Document not found" });

    const fileInfo = doc[fileType];
    const bucket = getBucket();
    if (fileInfo && fileInfo.fileId && bucket) {
      // Delete from GridFS bucket chunks and files
      await bucket.delete(new mongoose.Types.ObjectId(fileInfo.fileId));
    }

    doc[fileType] = undefined;
    await doc.save();
    return res.json(doc);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const downloadAttachment = async (req, res) => {
  try {
    const fileId = new mongoose.Types.ObjectId(req.params.fileId);

    // Verify ownership of the referenced attachment file
    const ownership = await Promise.all([
      Sale.exists({ userId: req.user.id, $or: [{ "billFile.fileId": fileId }, { "receiptFile.fileId": fileId }] }),
      Purchase.exists({ userId: req.user.id, $or: [{ "billFile.fileId": fileId }, { "receiptFile.fileId": fileId }] }),
      Expense.exists({ userId: req.user.id, $or: [{ "billFile.fileId": fileId }, { "receiptFile.fileId": fileId }] })
    ]);

    if (!ownership.some(Boolean)) {
      return res.status(403).json({ error: "Access denied. You do not own this attachment file." });
    }

    const bucket = getBucket();
    if (!bucket) return res.status(500).json({ error: "Storage bucket not initialized" });

    const files = await bucket.find({ _id: fileId }).toArray();
    if (!files || files.length === 0) {
      return res.status(404).json({ error: "File not found" });
    }

    const file = files[0];
    res.set("Content-Type", file.contentType);
    res.set("Content-Length", file.length);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);

    const downloadStream = bucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      res.status(500).json({ error: "Streaming error: " + err.message });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  uploadAttachment,
  removeAttachment,
  downloadAttachment
};
