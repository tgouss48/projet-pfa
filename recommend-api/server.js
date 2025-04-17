require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const recommendationRoutes = require("./routes/recomRoute");
const historiqueRoutes = require("./routes/historiqueRoute");

const app = express();
app.use(express.json());
app.use(cors());

app.use("/api", recommendationRoutes);
app.use("/api/historique", historiqueRoutes);

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connecté à MongoDB Atlas");
    app.listen(process.env.PORT, () => {
      console.log(`Recommendation API running on : http://localhost:${process.env.PORT}`);
    });
  })
  .catch((err) => console.error("Erreur MongoDB :", err));