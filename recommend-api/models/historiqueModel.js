const mongoose = require("mongoose");

const historiqueSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  offerId: { type: String, required: true },
  action: {
    type: String,
    enum: ["Consulté", "Postulé"],
    required: true
  },
  score: Number,
  createdAt: { type: Date, default: Date.now }
}, {
  collection: "Historique_Collection"
});

module.exports = mongoose.model("Historique", historiqueSchema);