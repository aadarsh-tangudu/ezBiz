const ProductionRun = require("../models/ProductionRun");
const StockItem = require("../models/StockItem");
const Worker = require("../models/Worker");
const runInTransaction = require("../utils/transaction");

module.exports = {
  getProductionRuns: async (req, res) => {
    try {
      const runs = await ProductionRun.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(runs);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  runProduction: async (req, res) => {
    try {
      const runData = req.body;

      const result = await runInTransaction(async (session) => {
        // 1. Deduct inputs and Add outputs
        for (const input of runData.inputs) {
          const item = await StockItem.findOne({ _id: input.itemId, userId: req.user.id }).session(session);
          if (item) {
            if (!item.hasGrades) {
              item.stockQuantity = Math.max(0, (item.stockQuantity || 0) - input.actualQty);
              await item.save({ session });
            } else {
              const gradeObj = item.grades.find((g) => g.grade === input.grade);
              if (gradeObj) {
                gradeObj.stockQuantity = Math.max(0, gradeObj.stockQuantity - input.actualQty);
                await item.save({ session });
              }
            }
          }
        }

        for (const output of runData.outputs) {
          const item = await StockItem.findOne({ _id: output.itemId, userId: req.user.id }).session(session);
          if (item) {
            if (!item.hasGrades) {
              item.stockQuantity = (item.stockQuantity || 0) + output.actualQty;
              await item.save({ session });
            } else {
              const gradeObj = item.grades.find((g) => g.grade === output.grade);
              if (gradeObj) {
                gradeObj.stockQuantity += output.actualQty;
                await item.save({ session });
              }
            }
          }
        }

        // 2. Save production run
        const run = new ProductionRun({ ...runData, userId: req.user.id });
        await run.save({ session });

        // 3. Mark worker paymentStatuses
        const workerIds = (runData.workers || []).map((w) => w.workerId);
        const dbWorkers = await Worker.find({ _id: { $in: workerIds }, userId: req.user.id }).session(session);

        for (const dbw of dbWorkers) {
          const rw = runData.workers.find((w) => w.workerId === dbw.id);
          if (rw && rw.wages > 0) {
            const hasPaidBefore = (dbw.paidAmount || 0) > 0;
            dbw.paymentStatus = hasPaidBefore ? "Partially Paid" : "Pending";
            await dbw.save({ session });
          }
        }

        return run;
      });

      const inventory = await StockItem.find({ userId: req.user.id });
      const workers = await Worker.find({ userId: req.user.id });
      res.status(201).json({ run: result, inventory, workers });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
