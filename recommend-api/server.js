require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const csrf = require('csurf');
const cors = require('cors');
const cookieParser = require("cookie-parser");
const recommendationRoutes = require("./routes/recomRoute");
const historiqueRoutes = require("./routes/historiqueRoute");

const app = express();

app.use(cors({
  origin: process.env.FRONT_URL,
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.RUN_ENV === 'AWS'
  }
});
app.use(csrfProtection);

app.get('/api/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.use("/api/", recommendationRoutes);
app.use("/api/historique", historiqueRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connecté à MongoDB Atlas");
    app.listen(process.env.PORT, () => {
      console.log(`Server running on port :${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("Erreur MongoDB :", err));