const mongoose = require("mongoose");

const WorkerSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  name: { type: String, required: true },
  role: { type: String, default: "Operator" },
  type: { type: String, enum: ["Wage", "Salary"], required: true },
  rate: { type: Number, default: 0 },
  paymentStatus: { type: String, enum: ["Pending", "Paid", "Partially Paid"], default: "Pending" },
  paidAmount: { type: Number, default: 0 }
}, { timestamps: true });

module.exports = mongoose.model("Worker", WorkerSchema);
