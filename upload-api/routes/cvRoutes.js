const express = require("express");
const router = express.Router();
const cvController = require("../controllers/cvController");
const { verifyToken } = require("../middlewares/authMiddleware");
const upload = require('../middlewares/multer');

router.post("/upload", verifyToken, upload.single("cv"), cvController.uploadAndAnalyze);
router.get("/:id/file", verifyToken, cvController.downloadCV);
router.get('/exist/:userId', cvController.existCV);
router.get("/me/text", verifyToken, cvController.getMyCVText);
router.get('/info', verifyToken, cvController.getCVInfo);

// Pour ALB
router.get('/health', (req, res) => {
    res.status(200).send('Upload service fonctionne');
});

module.exports = router;