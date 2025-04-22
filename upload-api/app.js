const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const csrf = require("csurf");
const dotenv = require("dotenv");
const cvRoutes = require("./routes/cvRoutes");

dotenv.config();
const app = express();

app.use(cors({
    origin: process.env.FRONT_URL,
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use("/api/cv", cvRoutes);

const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.RUN_ENV === 'AWS'
  }
});
app.use(csrfProtection);

app.get("/api/csrf-token", (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

module.exports = app;