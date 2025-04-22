const bcrypt = require("bcrypt");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
  register,
  login,
  forgotPassword,
  resetPassword,
  checkEmail,
  verifyResetToken
} = require("../controllers/authController");

const {
  findUserByEmail,
  createUser,
  updateResetToken,
  resetPassword: resetPasswordFromModel
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
      json: jest.fn(),
      cookie: jest.fn(),
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
      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'fake-token',
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'Strict'
        })
      );
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

      req.body.email = "user@mail.com";

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

      expect(res.cookie).toHaveBeenCalledWith(
        'token',
        'fake-token',
        expect.objectContaining({
          httpOnly: true,
          secure: expect.any(Boolean),
          sameSite: 'Strict'
        })
      );
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
      const validToken = "valid-token";
      const future = new Date(Date.now() + 3600000);
  
      req.body = {
        token: validToken,
        newPassword: "newpass123"
      };
  
      jest.spyOn(jwt, "verify").mockReturnValue({ email: "user@mail.com" });
  
      findUserByEmail.mockResolvedValue({
        reset_token: validToken,
        reset_token_expires: future
      });
  
      resetPasswordFromModel.mockResolvedValue();
  
      await resetPassword(req, res);
  
      expect(resetPasswordFromModel).toHaveBeenCalledWith(expect.any(String), expect.any(String));
      expect(res.json).toHaveBeenCalledWith({ msg: "Mot de passe réinitialisé avec succès" });
    });
  
    it("Token invalide (ne correspond pas)", async () => {
      req.body = {
        token: "wrong-token",
        newPassword: "xxx"
      };
  
      jest.spyOn(jwt, "verify").mockReturnValue({ email: "user@mail.com" });
  
      findUserByEmail.mockResolvedValue({
        reset_token: "not-matching",
        reset_token_expires: new Date(Date.now() + 3600000) // Non expiré
      });
  
      await resetPassword(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Lien invalide" });
    });
  
    it("Token expiré", async () => {
      req.body = {
        token: "valid-token",
        newPassword: "xxx"
      };
  
      jest.spyOn(jwt, "verify").mockReturnValue({ email: "user@mail.com" });
  
      findUserByEmail.mockResolvedValue({
        reset_token: "valid-token",
        reset_token_expires: new Date(Date.now() - 1000) // Expiré
      });
  
      await resetPassword(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Lien expiré" });
    });
    
  });  

  describe("Check Email", () => {
    it("Email non fourni", async () => {
      req.body = {};
  
      await checkEmail(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ msg: "Email requis" });
    });
  
    it("Email existe déja", async () => {
      req.body = { email: "user@mail.com" };
      findUserByEmail.mockResolvedValue({ id: "u123" });
  
      await checkEmail(req, res);
  
      expect(res.json).toHaveBeenCalledWith({ exists: true });
    });
  
    it("Email n'existe pas", async () => {
      req.body = { email: "unknown@mail.com" };
      findUserByEmail.mockResolvedValue(null);
  
      await checkEmail(req, res);
  
      expect(res.json).toHaveBeenCalledWith({ exists: false });
    });
  });  

  describe("Verify Reset Token", () => {
    it("Token invalide", async () => {
      req.body = { token: "invalid-token" };
  
      jest.spyOn(jwt, "verify").mockImplementation(() => {
        throw new Error("Invalid token");
      });
  
      await verifyResetToken(req, res);
  
      expect(res.json).toHaveBeenCalledWith({ valid: false });
    });
  
    it("Token invalid : utilisateur non trouvé", async () => {
      req.body = { token: "valid-token" };
  
      jest.spyOn(jwt, "verify").mockReturnValue({ email: "user@mail.com" });
      findUserByEmail.mockResolvedValue(null);
  
      await verifyResetToken(req, res);
  
      expect(res.json).toHaveBeenCalledWith({ valid: false });
    });
  
    it("Token invalid expiré", async () => {
      req.body = { token: "valid-token" };
  
      jest.spyOn(jwt, "verify").mockReturnValue({ email: "user@mail.com" });
      findUserByEmail.mockResolvedValue({
        reset_token: "different-token",
        reset_token_expires: new Date(Date.now() - 1000)
      });
  
      await verifyResetToken(req, res);
  
      expect(res.json).toHaveBeenCalledWith({ valid: false });
    });
  
    it("Token valid non expire", async () => {
      req.body = { token: "valid-token" };
  
      jest.spyOn(jwt, "verify").mockReturnValue({ email: "user@mail.com" });
      findUserByEmail.mockResolvedValue({
        reset_token: "valid-token",
        reset_token_expires: new Date(Date.now() + 10000)
      });
  
      await verifyResetToken(req, res);
  
      expect(res.json).toHaveBeenCalledWith({ valid: true });
    });
  });  

});