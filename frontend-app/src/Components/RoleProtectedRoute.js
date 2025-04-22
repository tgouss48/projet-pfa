import { Navigate } from 'react-router-dom';
import { useAuth } from '../Contexts/AuthContext';
import { ClipLoader } from 'react-spinners';

const RoleProtectedRoute = ({ allowedRoles, children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: '50px' }}>
        <ClipLoader color="#36d7b7" size={50} />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/forbidden" />;
  }

  return children;
};

export default RoleProtectedRoute;