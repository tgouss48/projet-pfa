const Historique = require("../models/historiqueModel");
const Offre = require("../models/offerModel");

const priorityMap = {
  Consulté: 1,
  Postulé: 2
};

// Fonction centrale pour gérer la priorité
async function saveUserAction(userId, offerId, newAction, score) {
  const existing = await Historique.findOne({ userId, offerId });
  const newPriority = priorityMap[newAction];
  const currentPriority = priorityMap[existing?.action] || 0;

  if (!existing) {
    await Historique.create({
      userId,
      offerId,
      action: newAction,
      score,
      createdAt: new Date()
    });
  } else if (newPriority > currentPriority) {
    await Historique.updateOne(
      { _id: existing._id },
      { action: newAction, score, createdAt: new Date()}
    );
  }
}

exports.saveAction = async (req, res) => {
  const { offerId, action, score } = req.body;
  const userId = req.user.id;

  if (!["Consulté", "Postulé"].includes(action)) {
    return res.status(400).json({ error: "Action invalide" });
  }

  try {
    await saveUserAction(userId, offerId, action, score);

    // Vérifier qu'on garde max 10 éléments dans l'historique
    const allHist = await Historique.find({ userId, action: { $in: ["Consulté", "Postulé"] } });

    const sorted = allHist.sort((a, b) => {
      const pa = priorityMap[a.action], pb = priorityMap[b.action];
      if (pb !== pa) return pb - pa;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const toKeep = sorted.slice(0, 10);
    const toDelete = sorted.slice(10);

    if (toDelete.length > 0) {
      await Historique.deleteMany({ _id: { $in: toDelete.map(h => h._id) } });
    }

    return res.status(200).json({ message: `Action ${action} enregistrée avec succès` });
  } catch (err) {
    console.error("Erreur historique :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};

exports.getHistory = async (req, res) => {
  const userId = req.user.id;

  try {
    const historique = await Historique.find({ userId, action: { $in: ["Consulté", "Postulé"] } });

    const sorted = historique.sort((a, b) => {
      const pa = priorityMap[a.action], pb = priorityMap[b.action];
      if (pb !== pa) return pb - pa;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    const finalHist = sorted.slice(0, 10);
    const offerIds = finalHist.map(h => h.offerId);
    const offers = await Offre.find({ _id: { $in: offerIds } });

    const history = finalHist.map(h => {
      const offer = offers.find(o => o._id.toString() === h.offerId.toString());
      return offer ? { ...offer.toObject(), source: h.action, score: h.score,  actionDate: h.createdAt } : null;
    }).filter(x => x !== null);

    return res.status(200).json({ history });
  } catch (err) {
    console.error("Erreur historique :", err);
    return res.status(500).json({ error: "Erreur serveur" });
  }
};