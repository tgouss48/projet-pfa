const express = require("express");
const router = express.Router();
const controller = require("../controllers/historiqueController");
const { authenticateToken } = require("../middleware/authMiddleware");

router.post("/", authenticateToken, controller.saveAction);
router.get("/", authenticateToken, controller.getHistory);

module.exports = router;