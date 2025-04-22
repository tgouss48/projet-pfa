const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(401).json({ msg: 'Non autorisé, token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Ajoute user dans la request
    next();
  } catch (err) {
    console.error('Erreur d\'authentification', err);
    return res.status(401).json({ msg: 'Token invalide' });
  }
};

module.exports = authenticate;