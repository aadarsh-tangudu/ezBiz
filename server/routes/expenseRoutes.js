const express = require("express");
const router = express.Router();
const expenseController = require("../controllers/expenseController");
const attachmentController = require("../controllers/attachmentController");
const { upload } = require("../middlewares/upload");
const Expense = require("../models/Expense");

router.get("/", expenseController.getExpenses);
router.post("/", expenseController.addExpense);
router.post("/:id/upload", upload.single("file"), attachmentController.uploadAttachment(Expense, "id"));
router.delete("/:id/upload", attachmentController.removeAttachment(Expense, "id"));

module.exports = router;
