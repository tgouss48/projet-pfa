const mongoose = require("mongoose");

const offerSchema = new mongoose.Schema({
  Titre: String,
  Lien: String,
  Entreprise: String,
  Études: String,
  Expérience: String,
  "Type de contrat": String,
  Région: String,
  Date: String,
  Description: String
}, { collection: "Offres_Collections" });

module.exports = mongoose.model("Offre", offerSchema);