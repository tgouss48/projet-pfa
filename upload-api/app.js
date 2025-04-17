const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cvRoutes = require("./routes/cvRoutes");

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/cv", cvRoutes);

module.exports = app;