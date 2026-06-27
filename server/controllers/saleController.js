const Sale = require("../models/Sale");
const StockItem = require("../models/StockItem");
const runInTransaction = require("../utils/transaction");

module.exports = {
  getSales: async (req, res) => {
    try {
      const sales = await Sale.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(sales);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addSale: async (req, res) => {
    try {
      const saleData = req.body;

      const result = await runInTransaction(async (session) => {
        // Deduct inventory items
        for (const item of saleData.items) {
          const dbItem = await StockItem.findOne({ _id: item.itemId, userId: req.user.id }).session(session);
          if (dbItem) {
            if (!dbItem.hasGrades) {
              dbItem.stockQuantity = Math.max(0, (dbItem.stockQuantity || 0) - item.qty);
              await dbItem.save({ session });
            } else {
              const gradeObj = dbItem.grades.find((g) => g.grade === item.grade);
              if (gradeObj) {
                gradeObj.stockQuantity = Math.max(0, gradeObj.stockQuantity - item.qty);
                await dbItem.save({ session });
              }
            }
          }
        }

        const sale = new Sale({ ...saleData, userId: req.user.id });
        await sale.save({ session });
        return sale;
      });

      const inventory = await StockItem.find({ userId: req.user.id });
      res.status(201).json({ sale: result, inventory });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  paySale: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      const sale = await Sale.findOne({ _id: id, userId: req.user.id });
      if (!sale) return res.status(404).json({ error: "Sale not found" });

      const currentPaid = sale.paidAmount !== undefined ? sale.paidAmount : (sale.paymentStatus === "Paid" ? sale.totalAmount : 0);
      const newPaidAmount = Math.min(sale.totalAmount, currentPaid + Number(amount));
      const newStatus = newPaidAmount >= sale.totalAmount ? "Paid" : "Partially Paid";

      sale.paidAmount = newPaidAmount;
      sale.paymentStatus = newStatus;
      await sale.save();
      res.json(sale);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
