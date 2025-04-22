const app = require("./app");
const mongoose = require("mongoose");

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connecté à MongoDB Atlas");
    app.listen(process.env.PORT, () => {
      console.log(`Serveur démarré on port : ${process.env.PORT}`);
    });
  })
  .catch((err) => {
    console.error("Erreur connexion MongoDB :", err);
  });