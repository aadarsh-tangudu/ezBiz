const User = require("../models/User");
const StockItem = require("../models/StockItem");
const Worker = require("../models/Worker");
const Template = require("../models/Template");
const ProductionRun = require("../models/ProductionRun");
const Sale = require("../models/Sale");
const Purchase = require("../models/Purchase");
const Expense = require("../models/Expense");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "ezbiz_jwt_secret_key_12345";

module.exports = {
  register: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
      }

      const existingUser = await User.findOne({ username: username.trim() });
      if (existingUser) {
        return res.status(400).json({ error: "Username is already taken." });
      }

      const userCount = await User.countDocuments({});

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = new User({
        username: username.trim(),
        password: hashedPassword
      });

      await user.save();

      // If this is the very first user, claim any legacy ownerless records
      if (userCount === 0) {
        await Promise.all([
          StockItem.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
          Worker.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
          Template.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
          ProductionRun.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
          Sale.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
          Purchase.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } }),
          Expense.updateMany({ userId: { $exists: false } }, { $set: { userId: user._id } })
        ]);
      }

      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

      res.status(201).json({
        token,
        user: {
          id: user._id,
          username: user.username
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  login: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required." });
      }

      const user = await User.findOne({ username: username.trim() });
      if (!user) {
        return res.status(400).json({ error: "Invalid username or password." });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid username or password." });
      }

      const token = jwt.sign({ id: user._id, username: user.username }, JWT_SECRET, { expiresIn: "7d" });

      res.json({
        token,
        user: {
          id: user._id,
          username: user.username
        }
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  },

  me: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      if (!user) return res.status(404).json({ error: "User not found" });
      res.json({
        id: user._id,
        username: user.username
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }
};
