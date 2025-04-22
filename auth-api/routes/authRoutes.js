const express = require('express');
const router = express.Router();
const authenticate = require('../middlewares/authMiddleware');
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  checkEmail,
  verifyResetToken,
  logout
} = require('../controllers/authController');

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/check-email', checkEmail);
router.post('/verify-reset-token', verifyResetToken);

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

router.post('/logout', authenticate, logout);

// Pour ALB
router.get('/health', (req, res) => {
  res.status(200).send('Auth service fonctionne');
});

module.exports = router;