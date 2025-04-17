const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const CV = require("../models/cvModel");

exports.uploadAndAnalyze = async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name;
    const filePath = path.resolve(req.file.path);
    const fileBuffer = fs.readFileSync(filePath);

    const pythonProcess = spawn("python3", ["python/ocr.py", filePath]);

    let data = "";
    pythonProcess.stdout.on("data", (chunk) => {
      data += chunk.toString();
    });

    pythonProcess.stderr.on("data", (err) => {
      console.error("Erreur Python:", err.toString());
    });

    pythonProcess.on("close", async (code) => {
      fs.unlinkSync(filePath);
      if (code !== 0) return res.status(500).json({ error: "Analyse échouée" });

      const result = JSON.parse(data);
      const savedCV = await CV.findOneAndUpdate(
        { userId },
        {
          userId,
          userName,
          cvFile: fileBuffer,
          cleanedText: result.texte_nettoye
        },
        {
          upsert: true,
          new: true,
          setDefaultsOnInsert: true
        }
      );
      

      res.status(201).json({ message: "CV sauvegardé", cvId: savedCV._id });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.downloadCV = async (req, res) => {
  try {
    const cv = await CV.findById(req.params.id);

    if (!cv || !cv.cvFile) {
      return res.status(404).json({ error: "CV non trouvé" });
    }

    res.set({
      "Content-Type": "application/pdf",
      "Content-Disposition": "attachment; filename=cv.pdf"
    });

    res.send(cv.cvFile);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors du téléchargement" });
  }
};
