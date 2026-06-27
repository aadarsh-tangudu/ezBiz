const mongoose = require("mongoose");

const StockGradeSchema = new mongoose.Schema({
  grade: { type: String, default: "" },
  stockQuantity: { type: Number, default: 0 },
  avgCost: { type: Number, default: 0 }
});

const StockItemSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
  name: { type: String, required: true, unique: true },
  unit: { type: String, required: true, default: "kg" },
  lowStockAlert: { type: Number, default: 100 },
  hasGrades: { type: Boolean, default: false },
  stockQuantity: { type: Number, default: 0 },
  avgCost: { type: Number, default: 0 },
  grades: [StockGradeSchema]
}, { timestamps: true });

module.exports = mongoose.model("StockItem", StockItemSchema);
