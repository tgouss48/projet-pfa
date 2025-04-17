const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const { connectDB } = require('./config/db');

dotenv.config();
const app = express();

connectDB();
app.use(express.json());
app.use(cors());
app.use('/api/auth', authRoutes);

module.exports = app;