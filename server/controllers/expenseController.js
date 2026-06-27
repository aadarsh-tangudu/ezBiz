const Expense = require("../models/Expense");

module.exports = {
  getExpenses: async (req, res) => {
    try {
      const expenses = await Expense.find({ userId: req.user.id }).sort({ createdAt: -1 });
      res.json(expenses);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  addExpense: async (req, res) => {
    try {
      const expense = new Expense({ ...req.body, userId: req.user.id });
      await expense.save();
      res.status(201).json(expense);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },
};
