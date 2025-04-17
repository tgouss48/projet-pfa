const { pool } = require('../config/db');

const findUserByEmail = async (email) => {
  const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
  return res.rows[0];
};

const createUser = async ({ nom, email, password, role }) => {
  const res = await pool.query(
    'INSERT INTO users (nom, email, password, role) VALUES ($1, $2, $3, $4) RETURNING *',
    [nom, email, password, role]
  );
  return res.rows[0];
};

const updateResetToken = async (email, token, expires) => {
  await pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3',
    [token, expires, email]
  );
};

const resetPassword = async (email, newPassword) => {
  await pool.query(
    'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE email = $2',
    [newPassword, email]
  );
};

module.exports = {
  findUserByEmail,
  createUser,
  updateResetToken,
  resetPassword,
};