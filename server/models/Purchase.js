const mongoose = require("mongoose");
const FileAttachmentSchema = require("./FileAttachment");

const PurchaseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  date: { type: String, required: true },
  supplierName: { type: String, default: "Walk-in Supplier" },
  supplierAddress: { type: String, default: "N/A" },
  supplierGstin: { type: String, default: "" },
  transportDetails: {
    type: { type: String, default: "Road" },
    vehicleNumber: { type: String, default: "N/A" },
    transporterId: { type: String, default: "N/A" },
    transporterName: { type: String, default: "N/A" }
  },
  items: [{
    itemId: { type: String, required: true },
    grade: { type: String, default: "" },
    qty: { type: Number, required: true },
    rate: { type: Number, required: true }
  }],
  totalCost: { type: Number, required: true },
  paymentType: { type: String, default: "Cash" },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Partially Paid"], default: "Pending" },
  paidAmount: { type: Number, default: 0 },
  billFile: FileAttachmentSchema,
  receiptFile: FileAttachmentSchema,
  notes: { type: String, default: "" }
}, { timestamps: true });

module.exports = mongoose.model("Purchase", PurchaseSchema);
