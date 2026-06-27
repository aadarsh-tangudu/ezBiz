const mongoose = require("mongoose");

const TemplateItemSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: "StockItem", required: true },
  grade: { type: String, default: "" },
  defaultQty: { type: Number, required: true }
});

const TemplateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  name: { type: String, required: true },
  wageType: { type: String, enum: ["Quantity", "Flat Rate"], required: true },
  flatRate: { type: Number, default: 0 },
  inputs: [TemplateItemSchema],
  outputs: [
    {
      itemId: { type: mongoose.Schema.Types.ObjectId, ref: "StockItem", required: true },
      grade: { type: String, default: "" },
      defaultQty: { type: Number, required: true },
      wageRate: { type: Number, default: 0 }
    }
  ],
  workers: [{ workerId: { type: String } }]
}, { timestamps: true });

module.exports = mongoose.model("Template", TemplateSchema);
