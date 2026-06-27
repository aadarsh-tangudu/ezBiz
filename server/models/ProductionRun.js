const mongoose = require("mongoose");

const RunWorkerSchema = new mongoose.Schema({
  workerId: { type: String, required: true },
  workerName: { type: String, required: true },
  wages: { type: Number, required: true }
});

const ProductionRunSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  templateId: { type: String, required: true },
  templateName: { type: String, required: true },
  date: { type: String, required: true },
  yieldPercent: { type: Number, required: true },
  wastage: { type: Number, required: true },
  notes: { type: String, default: "" },
  inputs: [{
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    grade: { type: String, default: "" },
    actualQty: { type: Number, required: true }
  }],
  outputs: [{
    itemId: { type: String, required: true },
    itemName: { type: String, required: true },
    grade: { type: String, default: "" },
    actualQty: { type: Number, required: true }
  }],
  workers: [RunWorkerSchema]
}, { timestamps: true });

module.exports = mongoose.model("ProductionRun", ProductionRunSchema);
