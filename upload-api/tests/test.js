const fs = require("fs");
const path = require("path");
const { uploadAndAnalyze, downloadCV } = require("../controllers/cvController");
const CV = require("../models/cvModel");
const { spawn } = require("child_process");

const dotenv = require('dotenv');
dotenv.config();

jest.mock("fs");
jest.mock("child_process");
jest.mock("../models/cvModel");

describe("CV API", () => {
  let req, res;

  beforeEach(() => {
    req = {
      user: { id: "user123", name: "User" },
      file: { path: "uploads/cv-test.pdf" },
      params: {}
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      send: jest.fn(),
      set: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe("CV Controller", () => {
    it("Analyse et sauvegarde le CV avec succès", async () => {
      const fakeCV = { _id: "cv123" };
      const fakeBuffer = Buffer.from("fake-pdf-buffer");

      fs.readFileSync.mockReturnValue(fakeBuffer);
      fs.unlinkSync.mockReturnValue();

      const stdout = {
        on: jest.fn((event, cb) => {
          if (event === "data") cb(JSON.stringify({ texte_nettoye: "Texte extrait" }));
        })
      };

      const pythonMock = {
        stdout,
        stderr: { on: jest.fn() },
        on: jest.fn((event, cb) => {
          if (event === "close") cb(0); // succès
        })
      };

      spawn.mockReturnValue(pythonMock);
      CV.findOneAndUpdate.mockResolvedValue(fakeCV);

      await uploadAndAnalyze(req, res);

      expect(spawn).toHaveBeenCalledWith(process.env.PYTHON, ["python/ocr.py", path.resolve("uploads/cv-test.pdf")]);
      expect(CV.findOneAndUpdate).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ message: "CV sauvegardé", cvId: "cv123" });
    });

    it("Retourner une erreur si le script Python échoue", async () => {
      fs.readFileSync.mockReturnValue(Buffer.from("fake"));

      const pythonMock = {
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
        on: jest.fn((event, cb) => {
          if (event === "close") cb(1); // code erreur
        })
      };

      spawn.mockReturnValue(pythonMock);
      fs.unlinkSync.mockReturnValue();

      await uploadAndAnalyze(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Analyse échouée" });
    });

    it("Gèrer les erreurs serveur", async () => {
      fs.readFileSync.mockImplementation(() => { throw new Error("Erreur lecture fichier"); });

      await uploadAndAnalyze(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur serveur" });
    });
  });

  describe("Afficher CV", () => {
    it("Télécharge le CV si trouvé", async () => {
      req.params.id = "cv123";
      CV.findById.mockResolvedValue({
        cvFile: Buffer.from("pdf-file")
      });
    
      await downloadCV(req, res);
    
      expect(res.json).toHaveBeenCalledWith({
        cvDataUrl: expect.stringContaining("data:application/pdf;base64,")
      });
    });    

    it("Retourner 404 si CV non trouvé", async () => {
      CV.findById.mockResolvedValue(null);
      req.params.id = "cv999";

      await downloadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: "CV non trouvé" });
    });

    it("Retourne 500 en cas d'erreur serveur", async () => {
      CV.findById.mockRejectedValue(new Error("DB crash"));
      req.params.id = "cv500";

      await downloadCV(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: "Erreur lors du téléchargement" });
    });
  });
});