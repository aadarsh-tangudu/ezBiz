const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");

router.use("/auth", require("./authRoutes"));

router.use("/inventory", auth, require("./inventoryRoutes"));
router.use("/workers", auth, require("./workerRoutes"));
router.use("/templates", auth, require("./templateRoutes"));
router.use("/production", auth, require("./productionRoutes"));
router.use("/sales", auth, require("./saleRoutes"));
router.use("/purchases", auth, require("./purchaseRoutes"));
router.use("/expenses", auth, require("./expenseRoutes"));
router.use("/attachments", auth, require("./attachmentRoutes"));

module.exports = router;
