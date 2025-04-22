import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { checkEmail, forgotPassword } from '../Services/authService';
import './ForgotPassword.css';
import { FaArrowLeft, FaEnvelope } from 'react-icons/fa';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!email.trim()) {
      setError('Veuillez entrer votre email.');
      return;
    }
  
    setLoading(true);
    try {
      const exists = await checkEmail(email);
      if (!exists) {
        setError('Email non trouvé.');
      } else {
        setError('');

        await forgotPassword(email);
  
        setSubmitted(true);
        console.log('Lien envoyé pour:', email);
        setTimeout(() => {
          window.location.href = '/login';
        }, 5000);
      }
    } catch (err) {
      console.error(err);
      setError('Erreur de connexion au serveur.');
    }
    setLoading(false);
  };

  const hasError = !!error;

  return (
    <div className="forgot-page">
      <Link to="/login" className="register-back">
        <FaArrowLeft size={20} />
      </Link>

      <div className="forgot-container">
        <h1 className="logo-text">Mot de passe oublié</h1>

        {submitted ? (
          <div className="success-message">
            Un lien de réinitialisation a été envoyé à votre adresse e-mail.
          </div>
        ) : (
          <form className="forgot-form" onSubmit={handleSubmit}>
            <div className={`forgot-input-with-icon ${hasError ? 'input-error' : ''}`}>
              <FaEnvelope className="forgot-icon" />
              <input
                type="email"
                name="email"
                placeholder="Entrez votre email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                disabled={loading}
              />
            </div>

            {hasError && (
              <div className="error-message">{error}</div>
            )}

            <div className="btn-container">
              <button type="submit" className="btn" disabled={loading}>
                {loading ? <div className="spinner-button"></div> : 'Envoyer'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;