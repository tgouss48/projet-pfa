const bcrypt = require('bcrypt');
const { findUserByEmail, createUser, updateResetToken, resetPassword } = require('../models/userModel');
const { generateToken } = require('../utils/jwt');
const sendEmail = require('../utils/sendEmail');
const crypto = require('crypto');

exports.register = async (req, res) => {
  const { nom, email, password, role } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) return res.status(400).json({ msg: 'Email déjà utilisé' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser({ nom, email, password: hashed, role });
  const token = generateToken({ id: user.id, role: user.role, name: user.nom });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: 'Mot de passe incorrect' });

  const token = generateToken({ id: user.id, role: user.role, name: user.nom });
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' });

  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + 3600000); // 1h
  await updateResetToken(email, token, expires);

  const resetLink = `${process.env.CLIENT_URL}/api/auth/reset-password/${token}`;
  await sendEmail(email, 'Réinitialisation de mot de passe', `<a href="${resetLink}">Clique ici pour réinitialiser</a>`);

  res.json({ msg: 'Email envoyé' });
};

exports.resetPassword = async (req, res) => {
  const { email, token, newPassword } = req.body;
  const user = await findUserByEmail(email);
  if (!user || user.reset_token !== token || new Date(user.reset_token_expires) < new Date())
    return res.status(400).json({ msg: 'Token invalide ou expiré' });

  const hashed = await bcrypt.hash(newPassword, 10);
  await resetPassword(email, hashed);
  res.json({ msg: 'Mot de passe réinitialisé' });
};
