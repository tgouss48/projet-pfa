const mongoose = require("mongoose");

const cvSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  cvFile: Buffer,
  cleanedText: String,
  createdAt: { type: Date, default: Date.now }
}, {
  collection: "Cvs_Collections" 
});

module.exports = mongoose.model("CV", cvSchema);