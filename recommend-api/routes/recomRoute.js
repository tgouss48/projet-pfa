const express = require("express");
const router = express.Router();
const controller = require("../controllers/recomController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/recommend", authenticateToken, controller.getRecommendationCount);
router.get("/cv/:id/file", authenticateToken, controller.getCvFile);

module.exports = router;