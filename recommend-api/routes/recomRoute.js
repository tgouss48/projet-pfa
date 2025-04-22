const express = require("express");
const router = express.Router();
const controller = require("../controllers/recomController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/recommend", authenticateToken, controller.getRecommendationCount);
router.get("/cv/:id/file", authenticateToken, controller.getCvFile);

// Pour ALB
router.get('/recommend/health', (req, res) => {
    res.status(200).send('Recommend service fonctionne');
  });

module.exports = router;