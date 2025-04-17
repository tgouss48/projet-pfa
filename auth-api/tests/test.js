const bcrypt = require("bcrypt");
const crypto = require("crypto");
const {
  register,
  login,
  forgotPassword,
  resetPassword
} = require("../controllers/authController");

const {
  findUserByEmail,
  createUser,
  updateResetToken,
  resetPassword: resetPasswordInDb
} = require("../models/userModel");

const { generateToken } = require("../utils/jwt");
const sendEmail = require("../utils/sendEmail");

jest.mock("../models/userModel");
jest.mock("../utils/jwt");
jest.mock("../utils/sendEmail");

describe("Auth API", () => {
  let req, res;

  beforeEach(() => {
    req = { body: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    jest.clearAllMocks();
  });

  describe("Register", () => {
    it("Inscription d'un nouvel utilisateur", async () => {
      req.body = {
        nom: "User",
        email: "user@mail.com",
        password: "pass123",
        role: "Candidat"
      };

      findUserByEmail.mockResolvedValue(null);
      createUser.mockResolvedValue({
        id: "u123",
        email: req.body.email,
        role: req.body.role,
        nom: req.body.nom
      });
      generateToken.mockReturnValue("fake-token");

      await register(req, res);

      expect(createUser).toHaveBeenCalled();
      expect(generateToken).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({
        token: "fake-token",
        user: {
          id: "u123",
          email: "user@mail.com",
          role: "Candidat"
        }
      });
    });

    it("Retourner erreur si email existe déjà", async () => {
      findUserByEmail.mockResolvedValue({ id: "u123" });

      req.body.email = "nihal@mail.com";

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Email déjà utilisé" });
    });
  });

  describe("Login", () => {
    it("Connexion réussie", async () => {
      req.body = {
        email: "user@mail.com",
        password: "pass123"
      };

      const fakeUser = {
        id: "u123",
        email: "user@mail.com",
        password: await bcrypt.hash("pass123", 10),
        role: "Candidat",
        nom: "User"
      };

      findUserByEmail.mockResolvedValue(fakeUser);
      generateToken.mockReturnValue("fake-token");

      await login(req, res);

      expect(res.json).toHaveBeenCalledWith({
        token: "fake-token",
        user: {
          id: "u123",
          email: "user@mail.com",
          role: "Candidat"
        }
      });
    });

    it("Email introuvable", async () => {
      findUserByEmail.mockResolvedValue(null);

      req.body.email = "x@x.com";

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Utilisateur non trouvé" });
    });

    it("Mot de passe incorrect", async () => {
      const hashed = await bcrypt.hash("autrepass", 10);
      findUserByEmail.mockResolvedValue({ password: hashed });

      req.body = { email: "user@mail.com", password: "wrongpass" };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Mot de passe incorrect" });
    });
  });

  describe("Mot de passe oublié", () => {
    it("Envoyer un mail de réinitialisation", async () => {
      process.env.CLIENT_URL = "http://localhost:3000";

      req.body.email = "user@mail.com";

      findUserByEmail.mockResolvedValue({ id: "u123", email: req.body.email });
      updateResetToken.mockResolvedValue();
      sendEmail.mockResolvedValue();

      await forgotPassword(req, res);

      expect(updateResetToken).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ msg: "Email envoyé" });
    });

    it("Email non trouvé", async () => {
      findUserByEmail.mockResolvedValue(null);

      req.body.email = "unknown@mail.com";

      await forgotPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Utilisateur non trouvé" });
    });
  });

  describe("Réinitialisation mot de passe", () => {
    it("Réinitialisation réussie", async () => {
      const validToken = crypto.randomBytes(32).toString("hex");
      const future = new Date(Date.now() + 3600000);

      req.body = {
        email: "user@mail.com",
        token: validToken,
        newPassword: "newpass123"
      };

      findUserByEmail.mockResolvedValue({
        reset_token: validToken,
        reset_token_expires: future
      });

      resetPasswordInDb.mockResolvedValue();

      await resetPassword(req, res);

      expect(resetPasswordInDb).toHaveBeenCalled();
      expect(res.json).toHaveBeenCalledWith({ msg: "Mot de passe réinitialisé" });
    });

    it("Token invalide ou expiré", async () => {
      req.body = {
        email: "user@mail.com",
        token: "wrong-token",
        newPassword: "xxx"
      };

      findUserByEmail.mockResolvedValue({
        reset_token: "not-matching",
        reset_token_expires: new Date(Date.now() - 1000)
      });

      await resetPassword(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Token invalide ou expiré" });
    });
  });
});