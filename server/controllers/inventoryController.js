const StockItem = require("../models/StockItem");

module.exports = {
  getInventory: async (req, res) => {
    try {
      const items = await StockItem.find({ userId: req.user.id });
      res.json(items);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addInventoryItem: async (req, res) => {
    try {
      const { name, unit, lowStockAlert, hasGrades, grades, stocks, avgCost } = req.body;
      
      let finalGrades = [];
      let rootStockQty = 0;
      let rootAvgCost = 0;

      if (hasGrades) {
        if (grades && grades.length > 0) {
          if (typeof grades[0] === "object") {
            finalGrades = grades.map((g) => ({
              grade: g.grade,
              stockQuantity: Number(g.stockQuantity) || 0,
              avgCost: Number(g.avgCost) || 0,
            }));
          } else {
            finalGrades = grades.map((g) => {
              const stockQty = Number(stocks?.[g]) || 0;
              const costVal = Number(avgCost?.[g]) || 0;
              return { grade: g, stockQuantity: stockQty, avgCost: costVal };
            });
          }
        }
      } else {
        // Handle normal stock item representation
        rootStockQty = Number(stocks?.[""]) || Number(req.body.stockQuantity) || 0;
        rootAvgCost = Number(avgCost?.[""]) || Number(req.body.avgCost) || 0;
      }

      const item = new StockItem({
        userId: req.user.id,
        name,
        unit,
        lowStockAlert: Number(lowStockAlert) || 100,
        hasGrades: !!hasGrades,
        stockQuantity: rootStockQty,
        avgCost: rootAvgCost,
        grades: finalGrades,
      });

      await item.save();
      res.status(201).json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  adjustStock: async (req, res) => {
    try {
      const { id } = req.params;
      const { grade, deltaQty } = req.body;

      const item = await StockItem.findOne({ _id: id, userId: req.user.id });
      if (!item) return res.status(404).json({ error: "Item not found" });

      if (!item.hasGrades) {
        item.stockQuantity = Math.max(0, (item.stockQuantity || 0) + deltaQty);
      } else {
        const gradeIndex = item.grades.findIndex((g) => g.grade === grade);
        if (gradeIndex === -1) {
          // Create grade if it doesn't exist
          item.grades.push({ grade, stockQuantity: Math.max(0, deltaQty), avgCost: 0 });
        } else {
          const currentQty = item.grades[gradeIndex].stockQuantity;
          item.grades[gradeIndex].stockQuantity = Math.max(0, currentQty + deltaQty);
        }
      }

      await item.save();
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  updateItemGrades: async (req, res) => {
    try {
      const { id } = req.params;
      const { newGrades, renameMap = {} } = req.body;

      const item = await StockItem.findOne({ _id: id, userId: req.user.id });
      if (!item) return res.status(404).json({ error: "Item not found" });

      const nextGrades = newGrades.map((gradeItem) => {
        const g = (gradeItem && typeof gradeItem === "object") ? gradeItem.grade : gradeItem;
        const oldKey = Object.keys(renameMap).find((k) => renameMap[k] === g);
        if (oldKey) {
          const matchedOld = item.grades.find((x) => x.grade === oldKey);
          return { grade: g, stockQuantity: matchedOld?.stockQuantity || 0, avgCost: matchedOld?.avgCost || 0 };
        } else {
          const matched = item.grades.find((x) => x.grade === g);
          return { grade: g, stockQuantity: matched?.stockQuantity || 0, avgCost: matched?.avgCost || 0 };
        }
      });

      item.grades = nextGrades;
      await item.save();
      res.json(item);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
