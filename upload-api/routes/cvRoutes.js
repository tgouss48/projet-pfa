const express = require("express");
const router = express.Router();
const multer = require("multer");
const cvController = require("../controllers/cvController");
const { verifyToken } = require("../middlewares/authMiddleware");
const upload = require('../middlewares/multer');

router.post("/upload", verifyToken, upload.single("cv"), cvController.uploadAndAnalyze);
router.get("/:id/file", verifyToken, cvController.downloadCV);

module.exports = router;
