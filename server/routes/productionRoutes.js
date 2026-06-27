const express = require("express");
const router = express.Router();
const productionController = require("../controllers/productionController");

router.get("/runs", productionController.getProductionRuns);
router.post("/runs", productionController.runProduction);

module.exports = router;
