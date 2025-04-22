import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyResetToken, resetPassword } from '../Services/authService';
import { FaLock, FaCheckCircle, FaEye, FaEyeSlash } from 'react-icons/fa';
import './ResetPassword.css';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [tokenValid, setTokenValid] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await verifyResetToken(token);

        if (response.valid) {
          setTokenValid(true);
        } else {
          setError('Lien invalide ou expiré.');
        }
      } catch (err) {
        setError('Lien invalide ou expiré.');
      }
      setLoading(false);
    };
    verifyToken();
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');

    if (!password.trim() || !confirmPassword.trim()) {
      setError('Veuillez remplir tous les champs.');
      return;
    }
    if (password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    try {
      const response = await resetPassword(token, password);

      setMessage(response.msg);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Erreur lors de la réinitialisation.');
    }
  };

  useEffect(() => {
    if (password && confirmPassword && password === confirmPassword) {
      setError('');
    }
  }, [password, confirmPassword]);

  const isPasswordMatch = password && confirmPassword && password === confirmPassword;

  if (loading) {
    return (
      <div className="reset-loading">
        <div className="spinner"></div>
      </div>
    );
  }
  

  if (error && !tokenValid) {
    return (
      <div className="reset-error">{error}</div>
    );
  }

  return (
    <div className="reset-page">
      <div className="reset-container">
        <h1 className="reset-logo-text">Nouveau mot de passe</h1>

        {message && <div className="success-message">{message}</div>}

        <form className="reset-form" onSubmit={handleSubmit}>
          <div className={`reset-input-with-icon ${error && (!password.trim() || password.length < 8) ? 'input-error' : ''}`}>
            <FaLock className="reset-icon" />
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Nouveau mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="toggle-password" onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? <FaEyeSlash /> : <FaEye />}
            </div>
          </div>

          <div className={`reset-input-with-icon ${error && (!confirmPassword.trim() || password !== confirmPassword) ? 'input-error' : ''}`}>
            <FaCheckCircle
              className="reset-icon"
              style={{ color: confirmPassword ? (isPasswordMatch ? 'green' : 'red') : '#000' }}
            />
            <input
              type="password"
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          {error && (
            <div className="reset-error-message">{error}</div>
          )}

          <button type="submit" className="reset-btn">Réinitialiser</button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;