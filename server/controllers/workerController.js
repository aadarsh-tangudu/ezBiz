const Worker = require("../models/Worker");

module.exports = {
  getWorkers: async (req, res) => {
    try {
      const workers = await Worker.find({ userId: req.user.id });
      res.json(workers);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addWorker: async (req, res) => {
    try {
      const { name, role, type, rate, paymentStatus } = req.body;
      const worker = new Worker({
        userId: req.user.id,
        name,
        role,
        type,
        rate: Number(rate) || 0,
        paymentStatus: paymentStatus || "Pending",
        paidAmount: 0,
      });
      await worker.save();
      res.status(201).json(worker);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  editWorker: async (req, res) => {
    try {
      const { id } = req.params;
      const worker = await Worker.findOneAndUpdate({ _id: id, userId: req.user.id }, req.body, { new: true });
      res.json(worker);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  deleteWorker: async (req, res) => {
    try {
      const { id } = req.params;
      await Worker.findOneAndDelete({ _id: id, userId: req.user.id });
      res.json({ id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  markWagesPaid: async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, setPending, totalDue } = req.body;

      const worker = await Worker.findOne({ _id: id, userId: req.user.id });
      if (!worker) return res.status(404).json({ error: "Worker not found" });

      if (setPending) {
        worker.paidAmount = 0;
        worker.paymentStatus = "Pending";
      } else {
        const nextPaid = (worker.paidAmount || 0) + Number(amount);
        const actualDue = (totalDue !== undefined && totalDue !== null) ? Number(totalDue) : (worker.type === "Salary" ? worker.rate : 0);
        let status = "Pending";
        if (!isNaN(actualDue) && actualDue > 0) {
          if (nextPaid >= actualDue) status = "Paid";
          else if (nextPaid > 0) status = "Partially Paid";
        } else {
          status = "Paid";
        }
        worker.paidAmount = nextPaid;
        worker.paymentStatus = status;
      }

      await worker.save();
      res.json(worker);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
