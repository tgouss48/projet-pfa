import { createContext, useState, useEffect, useContext, useCallback } from 'react';
import { getProfile, login as loginApi, logout as logoutApi, register as registerApi } from '../Services/authService';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const logout = useCallback(async (showMessage = false) => {
    try {
      await logoutApi();
    } catch (error) {
      console.error('Erreur pendant logout:', error);
    }
    setUser(null);

    if (showMessage && !toast.isActive('sessionExpired')) {
      toast.info('Votre session a expiré. Merci de vous reconnecter.', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        toastId: 'sessionExpired'
      });

      setTimeout(() => {
        toast.dismiss('sessionExpired');
        navigate('/login');
      }, 3000); 
    } else {
    navigate('/login');
  }
  }, [navigate]);

  useEffect(() => {
    let intervalId;

    const fetchProfile = async () => {
      try {
        const currentUser = await getProfile();
        setUser(currentUser);
      } catch (err) {
        console.warn("Pas connecté, utilisateur inconnu.");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    const checkSession = async () => {
      try {
        await getProfile();

      } catch (err) {
        console.warn("Session expirée, déconnexion automatique.");
        await logout(true);
      }
    };

    fetchProfile();

    // Interval pour checker la session toutes les 10 minutes
    intervalId = setInterval(checkSession, 10 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [logout]);

  const login = async (email, password) => {
    const user = await loginApi(email, password);
    setUser(user);
    return user;
  };

  const register = async (nom, email, password, role) => {
    await registerApi(nom, email, password, role);
    const currentUser = await getProfile();
    setUser(currentUser);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);