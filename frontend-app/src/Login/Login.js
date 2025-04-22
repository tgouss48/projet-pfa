import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { ToastContainer, toast } from 'react-toastify';
import { useAuth } from '../Contexts/AuthContext';
import { checkIfCVExists } from '../Services/authService';
import 'react-toastify/dist/ReactToastify.css';
import './Login.css';

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirection = async () => {
      if (user) {
        toast.info('Vous êtes déjà connecté.', { position: "top-center", autoClose: 2000 });

        if (user.role === 'Candidat') {
          try {
            const hasCV = await checkIfCVExists(user.id);

            if (hasCV) {
              navigate('/historique');
            } else {
              navigate('/upload');
            }
          } catch (error) {
            console.error('Erreur lors de la vérification du CV:', error);
            navigate('/upload');
          }
        } else if (user.role === 'Recruteur') {
          navigate('/profil-description');
        }
      }
    };

    handleRedirection();
  }, [user, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!formData.email) {
      validationErrors.email = 'Veuillez remplir les champs';
    } else if (!emailRegex.test(formData.email)) {
      validationErrors.email = 'Adresse email invalide';
    }

    if (!formData.password) {
      validationErrors.password = 'Veuillez remplir les champs';
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      try {
        const user = await login(formData.email, formData.password);
        console.log('Login réussi:', user);

        if (user.role === 'Candidat') {
          const hasCV = await checkIfCVExists(user.id);

          if (hasCV) {
            navigate('/historique');
          } else {
            navigate('/upload');
          }
        } else if (user.role === 'Recruteur') {
          navigate('/profil-description');
        }

      } catch (error) {
        console.error('Erreur de login:', error);

        const updatedErrors = {};
        if (error.response?.data?.msg === 'Utilisateur non trouvé') {
          updatedErrors.email = "Cet utilisateur n'existe pas.";
        } else if (error.response?.data?.msg === 'Mot de passe incorrect') {
          updatedErrors.password = 'Le mot de passe est incorrect.';
        } else {
          updatedErrors.login = 'Erreur de connexion.';
        }
        setErrors(updatedErrors);
      }
    }
  };

  return (
    <div className="login-page">
      <ToastContainer />
      <Link to="/" className="login-back-arrow">
        <FaArrowLeft size={20} />
      </Link>

      <div className="login-container">
        <h1 className="login-logo-text">Connexion</h1>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="login-input-group">
            <div className={`login-input-with-icon ${errors.email ? 'login-input-error' : ''}`}>
              <FaEnvelope className="login-icon" />
              <input
                type="text"
                name="email"
                placeholder="Entrez votre email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="login-input-group">
            <div className={`login-input-with-icon login-password-field ${errors.password ? 'login-input-error' : ''}`}>
              <FaLock className="login-icon" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Entrez votre mot de passe"
                value={formData.password}
                onChange={handleChange}
              />
              <span className="login-toggle-password" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </span>
            </div>

            <div className="login-password-options">
              <div className="login-error-message-inline">
                {errors.email || errors.password || errors.login}
              </div>
              <Link to="/forgot-password" className="login-forgot-password-link">
                Mot de passe oublié ?
              </Link>
            </div>
          </div>

          <button type="submit" className="login-btn">Se connecter</button>
        </form>

        <div className="login-redirect">
          <p>Vous n’avez pas de compte ? <Link to="/register">Créez un compte</Link></p>
        </div>
      </div>
    </div>
  );
};

export default Login;