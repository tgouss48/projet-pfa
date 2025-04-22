const { saveAction, getHistory } = require("../controllers/historiqueController");
const { getRecommendationCount } = require("../controllers/recomController");
const Historique = require("../models/historiqueModel");
const Offre = require("../models/offerModel");
const Cv = require("../models/cvModel");

jest.mock("../models/historiqueModel");
jest.mock("../models/offerModel");
jest.mock("../models/cvModel");

describe("Tests historiques", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "user", role: "Candidat" },
      body: {
        offerId: "offer",
        action: "Consulté",
        score: 0.8,
        text: "Text"
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe("saveAction", () => {
    it("Creer une action", async () => {
      Historique.findOne.mockResolvedValue(null);
      Historique.find.mockResolvedValue([]);
      Historique.create.mockResolvedValue({});
      Historique.deleteMany.mockResolvedValue({});

      await saveAction(req, res);

      expect(Historique.create).toHaveBeenCalledWith(expect.objectContaining({
        userId: "user",
        offerId: "offer",
        action: "Consulté",
        score: 0.8
      }));

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ message: "Action Consulté enregistrée avec succès" });
    });

    it("Action Invalide", async () => {
      req.body.action = "Invalide";

      await saveAction(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Action invalide" });
    });

    it("Mise a jour action", async () => {
      Historique.findOne.mockResolvedValue({
        _id: "hist123",
        action: "Consulté"
      });

      req.body.action = "Postulé";
      Historique.updateOne.mockResolvedValue({});
      Historique.find.mockResolvedValue([]);
      Historique.deleteMany.mockResolvedValue({});

      await saveAction(req, res);

      expect(Historique.updateOne).toHaveBeenCalledWith(
        { _id: "hist123" },
        { action: "Postulé", score: 0.8, createdAt: expect.any(Date)}
      );

      expect(res.status).toHaveBeenCalledWith(200);
    });

    it("Erreur Serveur", async () => {
      Historique.findOne.mockRejectedValue(new Error("DB error"));

      await saveAction(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });

  describe("Historique Liste", () => {
    it("Retourner les 10 dernières actions avec leurs offres", async () => {
      const historiqueData = [
        { offerId: "1", action: "Postulé", createdAt: new Date(), score: 0.9 },
        { offerId: "2", action: "Consulté", createdAt: new Date(), score: 0.5 }
      ];

      const offreData = [
        { _id: "1", title: "Offre 1", toObject: function () { return this; } },
        { _id: "2", title: "Offre 2", toObject: function () { return this; } }
      ];

      Historique.find.mockResolvedValue(historiqueData);
      Offre.find.mockResolvedValue(offreData);

      await getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        history: expect.arrayContaining([
          expect.objectContaining({ title: "Offre 1", source: "Postulé", score: 0.9 }),
          expect.objectContaining({ title: "Offre 2", source: "Consulté", score: 0.5 })
        ])
      });
    });

    it("Erreur Serveur", async () => {
      Historique.find.mockRejectedValue(new Error("DB Error"));

      await getHistory(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });

  describe("Recommendations liste", () => {
    it("Retourne une erreur si texte ou rôle est invalide", async () => {
      req.body.text = "";
      req.user.role = "Autre";

      await getRecommendationCount(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: "Paramètres invalides." });
    });
  });
});