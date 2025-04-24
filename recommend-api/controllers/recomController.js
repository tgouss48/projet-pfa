const { spawn } = require("child_process");
const path = require("path");
const Offre = require("../models/offerModel");
const Cv = require("../models/cvModel");
const Historique = require("../models/historiqueModel");

const dotenv = require('dotenv');
dotenv.config();

exports.getRecommendationCount = async (req, res) => {
  const { text } = req.body;
  const userType = req.user.role;
  const userId = req.user.id;

  if (!text || !["Candidat", "Recruteur"].includes(userType)) {
    return res.status(400).json({ error: "Paramètres invalides." });
  }

  try {
    let descriptions = [], sourceData = [];

    if (userType === "Candidat") {
      const offres = await Offre.find({ Description: { $exists: true, $ne: "" } });
      sourceData = offres;
      descriptions = offres.map(o => o.Description);
    } else {
      const cvs = await Cv.find({ cleanedText: { $exists: true, $ne: "" } });
      sourceData = cvs;
      descriptions = cvs.map(c => c.cleanedText);
    }

    const offerIds = sourceData.map(o => o._id.toString());
    const interactions = await Historique.find({ offerId: { $in: offerIds } });

    const payload = {
      userId,
      descriptions,
      offerIds,
      interactions: interactions.map(i => ({
        userId: i.userId,
        offerId: i.offerId,
        action: i.action
      }))
    };

    const scriptPath = path.join(__dirname, "../python/recomEngine.py");
    const py = spawn(process.env.PYTHON, [scriptPath, userType, text]);

    let output = "";
    py.stdout.on("data", data => output += data.toString());
    py.stderr.on("data", err => console.error("Erreur Python :", err.toString()));
    py.stdin.write(JSON.stringify(payload));
    py.stdin.end();

    py.on("close", async () => {
      const results = JSON.parse(output.trim());

      if (userType === "Candidat") {
        const postules = await Historique.find({ userId, action: "Postulé" }).distinct("offerId");

        const topOffers = [];

        for (const { offerId, score } of results) {
          if (postules.includes(offerId)) continue;

          const offer = sourceData.find(o => o._id.toString() === offerId);
          if (!offer) continue;

          const obj = offer.toObject();
          delete obj.Description;

          topOffers.push({ ...obj, score });

          if (topOffers.length >= 10) break;
        }

        return res.json({ recommendedOffers: topOffers });
      } else {
        const topCvs = results.map(({ offerId, score }) => {
          const cv = sourceData.find(c => c._id.toString() === offerId);

          const cvProtocol = process.env.CV_PROTOCOL || "http";
          const cvHost = process.env.CV_HOST || "localhost:3001";

          const formattedDate = new Date(cv.createdAt).toLocaleDateString('fr-FR');

          if (!cv) return null;
          return {
            userName: cv.userName,
            createdAt: formattedDate,
            score,
            cvUrl: `${cvProtocol}://${cvHost}/api/cv/${cv._id}/file`
          };
        }).filter(x => x !== null);

        return res.json({ recommendedCvs: topCvs.slice(0, 10) });
      }
    });

  } catch (err) {
    console.error("Erreur serveur :", err);
    return res.status(500).json({ error: "Erreur serveur." });
  }
};

exports.getCvFile = async (req, res) => {
  try {
    const cv = await Cv.findById(req.params.id);
    if (!cv || !cv.cvFile) {
      return res.status(404).json({ error: "CV non trouvé." });
    }

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "inline; filename=cv.pdf");
    res.send(cv.cvFile);
  } catch (err) {
    console.error("Erreur lors de l’envoi du CV :", err);
    res.status(500).json({ error: "Erreur serveur." });
  }
};