const express = require("express");
const router = express.Router();
const purchaseController = require("../controllers/purchaseController");
const attachmentController = require("../controllers/attachmentController");
const { upload } = require("../middlewares/upload");
const Purchase = require("../models/Purchase");

router.get("/", purchaseController.getPurchases);
router.post("/", purchaseController.addPurchase);
router.post("/:id/pay", purchaseController.payPurchase);
router.post("/:id/upload", upload.single("file"), attachmentController.uploadAttachment(Purchase, "id"));
router.delete("/:id/upload", attachmentController.removeAttachment(Purchase, "id"));

module.exports = router;
