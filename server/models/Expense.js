const mongoose = require("mongoose");
const FileAttachmentSchema = require("./FileAttachment");

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  name: { type: String, required: true },
  amount: { type: Number, required: true },
  category: { type: String, enum: ["Utility", "Admin", "Transport", "Other"], required: true },
  date: { type: String, required: true },
  notes: { type: String, default: "" },
  billFile: FileAttachmentSchema,
  receiptFile: FileAttachmentSchema
}, { timestamps: true });

module.exports = mongoose.model("Expense", ExpenseSchema);
