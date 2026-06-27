const express = require("express");
const router = express.Router();
const workerController = require("../controllers/workerController");

router.get("/", workerController.getWorkers);
router.post("/", workerController.addWorker);
router.put("/:id", workerController.editWorker);
router.delete("/:id", workerController.deleteWorker);
router.patch("/:id/pay", workerController.markWagesPaid);

module.exports = router;
