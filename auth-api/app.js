const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const csrf = require('csurf');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./config/db');

dotenv.config();
const app = express();

connectDB();

app.use(cors({
    origin: process.env.CLIENT_URL, // URL de ton frontend React
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());

// Protection CSRF
const csrfProtection = csrf({
    cookie: {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.RUN_ENV === 'AWS' // true en production HTTPS
    }
});
app.use(csrfProtection);

app.use('/api/auth', authRoutes);

// Route pour envoyer le CSRF token au frontend
app.get('/api/csrf-token', (req, res) => {
    res.json({ csrfToken: req.csrfToken() });
});

module.exports = app;