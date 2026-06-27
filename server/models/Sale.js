const mongoose = require("mongoose");
const FileAttachmentSchema = require("./FileAttachment");

const SaleItemSchema = new mongoose.Schema({
  itemId: { type: String, required: true },
  grade: { type: String, default: "" },
  qty: { type: Number, required: true },
  rate: { type: Number, required: true }
});

const SaleSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  date: { type: String, required: true },
  customerName: { type: String, default: "Walk-in Customer" },
  customerAddress: { type: String, default: "N/A" },
  customerGstin: { type: String, default: "" },
  transportDetails: {
    type: { type: String, default: "Road" },
    vehicleNumber: { type: String, default: "N/A" },
    transporterId: { type: String, default: "N/A" },
    transporterName: { type: String, default: "N/A" }
  },
  items: [SaleItemSchema],
  totalAmount: { type: Number, required: true },
  paymentType: { type: String, default: "Cash" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Partially Paid"], default: "Pending" },
  paidAmount: { type: Number, default: 0 },
  billFile: FileAttachmentSchema,
  receiptFile: FileAttachmentSchema,
  notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Sale", SaleSchema);
