import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowLeft, FaUser, FaEnvelope, FaLock, FaCheckCircle, FaTimes } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { register as registerUser } from '../Services/authService';
import 'react-toastify/dist/ReactToastify.css';
import './Register.css';

const Register = () => {
  const [typeInscription, setTypeInscription] = useState('Candidat');
  const [formData, setFormData] = useState({
    nomComplet: '',
    email: '',
    password: '',
    confirmPassword: '',
    termsAccepted: false,
  });
  const [errors, setErrors] = useState({});
  const [showConditions, setShowConditions] = useState(false);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const updatedForm = { ...formData, [name]: type === 'checkbox' ? checked : value };
    setFormData(updatedForm);

    const updatedErrors = { ...errors };

    if (name === 'nomComplet') {
      updatedErrors.nomComplet = !value.trim();
    }

    if (name === 'email') {
      updatedErrors.email = !validateEmail(value);
    }

    if (name === 'password') {
      updatedErrors.password = value.length < 8;
      updatedErrors.confirmPassword = updatedForm.confirmPassword && value !== updatedForm.confirmPassword;
    }

    if (name === 'confirmPassword') {
      updatedErrors.confirmPassword = value !== updatedForm.password;
    }

    if (name === 'termsAccepted' && checked) {
      updatedErrors.form = '';
    }

    setErrors(updatedErrors);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    let errorMessage = '';

    if (!formData.termsAccepted) {
      errorMessage = "Vous devez accepter les conditions.";
    } else if (!formData.password.trim() || formData.password.length < 8) {
      errorMessage = "Le mot de passe doit contenir 8 caractères.";
    }

    const validationErrors = {};
    if (!formData.nomComplet.trim()) validationErrors.nomComplet = true;
    if (!formData.email.trim() || !validateEmail(formData.email)) validationErrors.email = true;
    if (!formData.password.trim()) validationErrors.password = true;
    if (!formData.confirmPassword.trim() || formData.password !== formData.confirmPassword) validationErrors.confirmPassword = true;

    setErrors({ ...validationErrors, form: errorMessage });

    if (errorMessage || Object.keys(validationErrors).length > 0) return;

    try {
      await registerUser(formData.nomComplet, formData.email, formData.password, typeInscription);

      toast.success('Inscription réussie !', {
        position: "bottom-right",
        autoClose: 1500,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });

      setTimeout(() => {
        window.location.href = typeInscription === 'Candidat' ? '/upload' : '/profil-description';
      }, 1500);      

    } catch (error) {
      setErrors(prev => ({
        ...prev,
        form: error.response?.data?.msg || "Erreur lors de l'inscription.",
      }));
    }
  };

  const isPasswordMatch = formData.password && formData.confirmPassword && formData.password === formData.confirmPassword;

  return (
    <div className="register-page">
      <ToastContainer />
      <Link to="/" className="register-back">
        <FaArrowLeft size={20} />
      </Link>

      <div className="register-container">
        <h1 className="register-logo-text">Créer un compte</h1>

        <div className="role-switch">
          <button
            className={typeInscription === 'Candidat' ? 'active' : ''}
            onClick={() => setTypeInscription('Candidat')}
          >
            Candidat
          </button>
          <button
            className={typeInscription === 'Recruteur' ? 'active' : ''}
            onClick={() => setTypeInscription('Recruteur')}
          >
            Recruteur
          </button>
        </div>

        <form className="register-form" onSubmit={handleSubmit}>
          <div className={`register-input-with-icon ${errors.nomComplet ? 'input-error' : ''}`}>
            <FaUser className="register-icon" />
            <input
              type="text"
              name="nomComplet"
              placeholder={typeInscription === 'Recruteur' ? "Nom de l'entreprise" : "Nom complet"}
              value={formData.nomComplet}
              onChange={handleChange}
            />
          </div>

          <div className={`register-input-with-icon ${errors.email ? 'input-error' : ''}`}>
            <FaEnvelope className="register-icon" />
            <input
              type="text"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className={`register-input-with-icon ${errors.password ? 'input-error' : ''}`}>
            <FaLock className="register-icon" />
            <input
              type="password"
              name="password"
              placeholder="Mot de passe"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className={`register-input-with-icon ${errors.confirmPassword ? 'input-error' : ''}`}>
            <FaCheckCircle
              className="register-icon"
              style={{ color: formData.confirmPassword ? (isPasswordMatch ? 'green' : 'red') : '#000' }}
            />
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirmez le mot de passe"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <div className="register-terms">
            <input
              type="checkbox"
              name="termsAccepted"
              id="terms"
              checked={formData.termsAccepted}
              onChange={handleChange}
            />
            <label htmlFor="terms">
              J'accepte <button type="button" className="conditions-link" onClick={() => setShowConditions(true)}>conditions d'utilisation</button>.
            </label>
          </div>

          {errors.form && (
            <div className="register-error-message">{errors.form}</div>
          )}

          <button type="submit" className="register-btn">Commencer</button>

          <div className="login-redirect">
            <p>Déjà inscrit(e) ? <Link to="/login">S’identifier</Link></p>
          </div>
        </form>
      </div>

      {showConditions && (
        <div className="modal-overlay" onClick={() => setShowConditions(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Conditions d'utilisation</h2>
              <button className="modal-close" onClick={() => setShowConditions(false)}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <h3>1. Acceptation des conditions</h3>
              <p>En créant un compte, vous acceptez pleinement les présentes conditions...</p>

              <h3>2. Responsabilité de l'utilisateur</h3>
              <ul>
                <li>Fournir des informations exactes et complètes.</li>
                <li>Maintenir la confidentialité de votre mot de passe.</li>
                <li>Ne pas usurper l'identité d'un tiers.</li>
              </ul>

              <h3>3. Utilisation appropriée</h3>
              <ul>
                <li>Pas de contenu illégal, nuisible ou offensant.</li>
                <li>Pas d'accès non autorisé à nos systèmes.</li>
              </ul>

              <h3>4. Protection des données</h3>
              <p>Nous respectons votre vie privée et vos données sont traitées de manière sécurisée.</p>

              <h3>5. Suspension ou Résiliation</h3>
              <p>Violation des règles peut entraîner la suspension sans préavis.</p>

              <h3>6. Modifications</h3>
              <p>Nous nous réservons le droit de modifier les présentes conditions à tout moment.</p>

              <h3>7. Contact</h3>
              <p>Pour toute question, veuillez nous contacter via notre formulaire de contact.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Register;