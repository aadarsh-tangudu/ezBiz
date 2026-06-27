const Purchase = require("../models/Purchase");
const StockItem = require("../models/StockItem");
const runInTransaction = require("../utils/transaction");

module.exports = {
  getPurchases: async (req, res) => {
    try {
      const purchases = await Purchase.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(purchases);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addPurchase: async (req, res) => {
    try {
      const purchaseData = req.body;

      const result = await runInTransaction(async (session) => {
        // Update stock levels and average cost costing values
        for (const item of purchaseData.items) {
          const dbItem = await StockItem.findOne({ _id: item.itemId, userId: req.user.id }).session(session);
          if (dbItem) {
            if (!dbItem.hasGrades) {
              const currentStock = dbItem.stockQuantity || 0;
              const currentAvgCost = dbItem.avgCost || 0;

              const nextStock = currentStock + item.qty;
              const nextAvgCost = nextStock > 0
                ? ((currentStock * currentAvgCost) + (item.qty * item.rate)) / nextStock
                : item.rate;

              dbItem.stockQuantity = nextStock;
              dbItem.avgCost = nextAvgCost;
              await dbItem.save({ session });
            } else {
              const gradeObj = dbItem.grades.find((g) => g.grade === item.grade);
              if (gradeObj) {
                const currentStock = gradeObj.stockQuantity || 0;
                const currentAvgCost = gradeObj.avgCost || 0;

                const nextStock = currentStock + item.qty;
                const nextAvgCost = nextStock > 0
                  ? ((currentStock * currentAvgCost) + (item.qty * item.rate)) / nextStock
                  : item.rate;

                gradeObj.stockQuantity = nextStock;
                gradeObj.avgCost = nextAvgCost;
                await dbItem.save({ session });
              }
            }
          }
        }

        const purchase = new Purchase({ ...purchaseData, userId: req.user.id });
        await purchase.save({ session });
        return purchase;
      });

      const inventory = await StockItem.find({ userId: req.user.id });
      res.status(201).json({ purchase: result, inventory });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  payPurchase: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;

      const purchase = await Purchase.findOne({ _id: id, userId: req.user.id });
      if (!purchase) return res.status(404).json({ error: "Purchase not found" });

      const currentPaid = purchase.paidAmount !== undefined ? purchase.paidAmount : (purchase.paymentStatus === "Paid" ? purchase.totalCost : 0);
      const newPaidAmount = Math.min(purchase.totalCost, currentPaid + Number(amount));
      const newStatus = newPaidAmount >= purchase.totalCost ? "Paid" : "Partially Paid";

      purchase.paidAmount = newPaidAmount;
      purchase.paymentStatus = newStatus;
      await purchase.save();
      res.json(purchase);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
