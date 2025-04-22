import axios from 'axios';

const API = axios.create({
  baseURL: '/api/auth',
  withCredentials: true,
});

let csrfTokenCache = null;

// Récupérer CSRF token (avec cache)
export const getCsrfToken = async () => {
  if (csrfTokenCache) return csrfTokenCache; // Utiliser le cache

  const { data } = await axios.get('/api/csrf-token', { withCredentials: true });
  csrfTokenCache = data.csrfToken;
  return csrfTokenCache;
};

// Login
export const login = async (email, password) => {
  const csrfToken = await getCsrfToken();
  const { data } = await API.post('/login', { email, password }, {
    headers: { 'x-csrf-token': csrfToken }
  });
  return data.user;
};

// Register
export const register = async (nom, email, password, role) => {
  const csrfToken = await getCsrfToken();
  const { data } = await API.post('/register', { nom, email, password, role }, {
    headers: { 'x-csrf-token': csrfToken }
  });
  return data.user;
};

// Me : Profile connecte ou non
export const getProfile = async () => {
  const { data } = await API.get('/me');
  return data.user;
};

// Logout
export const logout = async () => {
  const csrfToken = await getCsrfToken();
  await API.post('/logout', {}, {
    headers: { 'x-csrf-token': csrfToken }
  });
};

// Forgot Password 
export const forgotPassword = async (email) => {
  const csrfToken = await getCsrfToken();
  await API.post('/forgot-password', { email }, {
    headers: { 'x-csrf-token': csrfToken }
  });
};

// Vérifier si l'email existe
export const checkEmail = async (email) => {
  const csrfToken = await getCsrfToken();
  const { data } = await API.post('/check-email', { email }, {
    headers: { 'x-csrf-token': csrfToken }
  });
  return data.exists;
};

// Historique
export const getHistorique = async () => {
  const csrfToken = await getCsrfToken();
  const { data } = await axios.get('/api/historique/', {
    headers: {
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return data.history || [];
};

// Infos utilisateur et CV
export const getUserCVInfo = async () => {
  const csrfToken = await getCsrfToken();
  const { data } = await axios.get('/api/cv/info', {
    headers: {
      'X-CSRF-Token': csrfToken,
      'Content-Type': 'application/json',
    },
    withCredentials: true,
  });
  return data;
};

// CV Exist
export const checkIfCVExists = async (userId) => {
  const { data } = await axios.get(`/api/cv/exist/${userId}`, {
    withCredentials: true,
  });
  return data.hasCV;
};

// Générer Profiles recommendés
export const generateRecommended = async (description) => {
  const csrfToken = await getCsrfToken();
  const { data } = await axios.post('/api/recommend/', 
    { text: description },
    {
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    }
  );
  return data.recommendedCvs || [];
};

// Générer Offres recommendés
export const recommendJobs = async (cleanedText) => {
  const csrfToken = await getCsrfToken();
  const { data } = await axios.post('/api/recommend', 
    { text: cleanedText },
    {
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    }
  );
  return data.recommendedOffers || [];
};

// Récupérer le CV d'un candidat pour affichage
export const fetchCvPreview = async (cvUrl) => {
  const { data } = await axios.get(cvUrl, { withCredentials: true });
  return data.cvDataUrl;
};

// Récupérer le texte nettoyé du CV
export const getCleanedCVText = async () => {
  const { data } = await axios.get('/api/cv/me/text', { withCredentials: true });
  return data.cleanedText;
};

// Enregistrer une action dans l'historique (consulté / postulé)
export const saveActionInHistory = async (offerId, action, score) => {
  const csrfToken = await getCsrfToken();
  await axios.post('/api/historique/',
    { offerId, action, score },
    {
      headers: {
        'X-CSRF-Token': csrfToken,
        'Content-Type': 'application/json'
      },
      withCredentials: true
    }
  );
};

// Vérifier validité du token de reset
export const verifyResetToken = async (token) => {
  const csrfToken = await getCsrfToken();
  const { data } = await API.post('/verify-reset-token', { token }, {
    headers: { 'x-csrf-token': csrfToken },
  });
  return data;
};

// Réinitialiser le mot de passe
export const resetPassword = async (token, newPassword) => {
  const csrfToken = await getCsrfToken();
  const { data } = await API.post('/reset-password', { token, newPassword }, {
    headers: { 'x-csrf-token': csrfToken },
  });
  return data;
};