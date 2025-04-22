import { Navigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

const GuestRoute = ({ children }) => {
  const { user, isLoading } = useAuth();
  const [alreadyNotified, setAlreadyNotified] = useState(false);

  useEffect(() => {
    if (!isLoading && user && !alreadyNotified) {
      toast.info('Vous êtes connecté.', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
        toastId: 'alreadyConnected'
      });
      setAlreadyNotified(true);
    }
  }, [user, isLoading, alreadyNotified]);

  if (isLoading) {
    return null;
  }

  if (user) {
    setTimeout(() => {
      toast.dismiss('alreadyConnected');
    }, 3000);
    if (user.role === 'Candidat') {
      return <Navigate to="/historique" replace />;
    } else if (user.role === 'Recruteur') {
      return <Navigate to="/profil-description" replace />;
    }
  }

  return children;
};

export default GuestRoute;