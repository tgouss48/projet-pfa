const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  userId: String,
  userName: String,
  cvFile: Buffer,
  cleanedText: String,
  createdAt: Date
}, { collection: "Cvs_Collections" });

module.exports = mongoose.model("Cv", cvSchema);