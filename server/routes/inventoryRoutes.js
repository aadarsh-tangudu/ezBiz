const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

router.get("/", inventoryController.getInventory);
router.post("/", inventoryController.addInventoryItem);
router.patch("/:id/adjust", inventoryController.adjustStock);
router.patch("/:id/grades", inventoryController.updateItemGrades);

module.exports = router;
