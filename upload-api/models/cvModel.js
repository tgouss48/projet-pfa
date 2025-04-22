const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  cvFile: Buffer,
  cleanedText: String,
}, {
  collection: "Cvs_Collections",
  timestamps: true
});

module.exports = mongoose.model("CV", cvSchema);