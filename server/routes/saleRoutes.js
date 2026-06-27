const express = require("express");
const router = express.Router();
const saleController = require("../controllers/saleController");
const attachmentController = require("../controllers/attachmentController");
const { upload } = require("../middlewares/upload");
const Sale = require("../models/Sale");

router.get("/", saleController.getSales);
router.post("/", saleController.addSale);
router.post("/:id/pay", saleController.paySale);
router.post("/:id/upload", upload.single("file"), attachmentController.uploadAttachment(Sale, "id"));
router.delete("/:id/upload", attachmentController.removeAttachment(Sale, "id"));

module.exports = router;
