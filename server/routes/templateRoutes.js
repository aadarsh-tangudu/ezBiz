const express = require("express");
const router = express.Router();
const templateController = require("../controllers/templateController");

router.get("/", templateController.getTemplates);
router.post("/", templateController.addTemplate);

module.exports = router;
