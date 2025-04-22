const fs = require("fs");
const { spawn } = require("child_process");
const path = require("path");
const CV = require("../models/cvModel");

const dotenv = require('dotenv');
dotenv.config();

exports.uploadAndAnalyze = async (req, res) => {
  try {
    const userId = req.user.id;
    const userName = req.user.name;
    const filePath = path.resolve(req.file.path);
    const fileBuffer = fs.readFileSync(filePath);

    const pythonProcess = spawn(process.env.PYTHON, ["python/ocr.py", filePath]);

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

    const base64 = cv.cvFile.toString('base64');

    const dataUrl = `data:application/pdf;base64,${base64}`;

    res.json({ cvDataUrl: dataUrl });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors du téléchargement" });
  }
};

exports.existCV = async (req, res) => {
  try {
    const userId = req.params.userId;
    const cv = await CV.findOne({ userId: userId });

    if (cv) {
      res.status(200).json({ hasCV: true });
    } else {
      res.status(200).json({ hasCV: false });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la vérification du CV" });
  }
};

exports.getMyCVText = async (req, res) => {
  try {
    const userId = req.user.id; // Récupéré depuis verifyToken
    const cv = await CV.findOne({ userId });

    if (!cv || !cv.cleanedText) {
      return res.status(404).json({ error: "Aucun CV trouvé pour cet utilisateur." });
    }

    res.json({ cleanedText: cv.cleanedText });
  } catch (error) {
    console.error("Erreur lors de la récupération du CV :", error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getCVInfo = async (req, res) => {
  try {
    const userId = req.user.id;

    const cv = await CV.findOne({ userId });

    if (!cv) {
      return res.status(404).json({ message: "Aucun CV trouvé" });
    }

    res.status(200).json({
      userName: cv.userName,
      lastUpdateDate: cv.updatedAt || cv.createdAt,
    });

  } catch (error) {
    console.error('Erreur récupération info CV:', error);
    res.status(500).json({ error: "Erreur serveur" });
  }
};