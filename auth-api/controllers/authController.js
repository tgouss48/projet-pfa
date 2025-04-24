const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser, updateResetToken, resetPassword } = require('../models/userModel');
const { generateToken } = require('../utils/jwt');
const sendEmail = require('../utils/sendEmail');

exports.register = async (req, res) => {
  const { nom, email, password, role } = req.body;
  const existing = await findUserByEmail(email);
  if (existing) return res.status(400).json({ msg: 'Email déjà utilisé' });

  const hashed = await bcrypt.hash(password, 10);
  const user = await createUser({ nom, email, password: hashed, role });
  const token = generateToken({ id: user.id, role: user.role, name: user.nom });
  
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.RUN_ENV === 'AWS', 
    sameSite: 'Strict',
    maxAge: 3600000,
  });
  
  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' });

  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(400).json({ msg: 'Mot de passe incorrect' });

  const token = generateToken({ id: user.id, role: user.role, name: user.nom });
  
  res.cookie('token', token, {
    httpOnly: true, 
    secure: process.env.RUN_ENV === 'AWS', // HTTPS obligatoire en production
    sameSite: 'Strict',
    maxAge: 3600000, // 1 heure
  });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
};

exports.logout = (req, res) => {
  res.clearCookie('token');
  res.json({ msg: 'Déconnecté' });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  
  const user = await findUserByEmail(email);
  if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' });

  const uniqueId = crypto.randomBytes(16).toString('hex');
  const token = generateToken({ email ,uniqueId});
  const expires = new Date(Date.now() + 3600000); // 1h
  await updateResetToken(email, token, expires);

  const resetLink = `${process.env.CLIENT_URL}/reset-password/${token}`;

  await sendEmail(
    email,
    'Réinitialisation de votre mot de passe',
    `
    <div style="font-family: Arial, sans-serif; padding: 20px; background: #f9f9f9; border-radius: 10px; max-width: 600px; margin: auto;">
      <h2 style="color: #333;">Réinitialisation de votre mot de passe</h2>
      <p>Bonjour,</p>
      <p>Nous avons reçu une demande pour réinitialiser le mot de passe de votre compte sur <strong>Career Compass</strong>.</p>
      <p>Pour créer un nouveau mot de passe, cliquez sur le bouton ci-dessous :</p>
      <div style="margin: 20px 0;">
        <a href="${resetLink}" style="padding: 10px 20px; background-color: #007BFF; color: white; text-decoration: none; border-radius: 5px;">
          Réinitialiser le mot de passe
        </a>
      </div>
      <p>Ce lien expirera dans 1 heure. Si vous n'avez pas demandé cette réinitialisation, ignorez simplement cet e-mail.</p>
      <hr style="margin: 30px 0;">
      <small style="color: #888;">© ${new Date().getFullYear()} Career Compass</small>
    </div>
    `
  ); 

  res.json({ msg: 'Email envoyé' });
};

exports.resetPassword = async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    const user = await findUserByEmail(email);
    if (!user) return res.status(400).json({ msg: 'Utilisateur non trouvé' });

    if (user.reset_token !== token) return res.status(400).json({ msg: 'Lien invalide' });

    if (new Date(user.reset_token_expires) < new Date()) return res.status(400).json({ msg: 'Lien expiré' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await resetPassword(email, hashedPassword);

    res.json({ msg: 'Mot de passe réinitialisé avec succès' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ msg: 'Token invalide ou expiré' });
  }
};


exports.checkEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ msg: 'Email requis' });

  const user = await findUserByEmail(email);
  if (user) {
    return res.json({ exists: true});
  } else {
    return res.json({ exists: false});
  }
};

exports.verifyResetToken = async (req, res) => {
  const { token } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // Vérifie la signature
    const { email } = decoded; // On récupère l'email depuis le payload du token

    const user = await findUserByEmail(email);
    if (!user) {
      return res.json({ valid: false });
    }

    if (user.reset_token !== token || new Date(user.reset_token_expires) < new Date()) {
      console.log('Token expiré.');
      return res.json({ valid: false });
    }

    return res.json({ valid: true });
  } catch (err) {
    console.error('Erreur de décodage du token:', err);
    return res.json({ valid: false });
  }
};