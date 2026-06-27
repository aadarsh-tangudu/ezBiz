const express = require("express");
const router = express.Router();
const attachmentController = require("../controllers/attachmentController");

router.get("/:fileId", attachmentController.downloadAttachment);

module.exports = router;
