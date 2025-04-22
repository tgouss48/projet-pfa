import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider, useAuth } from './Contexts/AuthContext';
import RoleProtectedRoute from './Components/RoleProtectedRoute';
import GuestRoute from './Components/GuestRoute';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import App from './Accueil/App';
import Register from './Register/Register';
import Login from './Login/Login';
import ForgotPassword from './ForgotPassword/ForgotPassword';
import ResetPassword from './ResetPassword/ResetPassword';
import Upload from './Upload/Upload';
import Recommendation from './Recommendation/Recommendation';
import Profile from './Profile/ProfileDescription';
import Historique from './Historique/Historique';
import NotFound from './Pages/NotFound';
import Forbidden from './Pages/Forbidden';

function Root() {
  const { isLoading } = useAuth();
  if (isLoading) {
    return null;
  }

  return (
    <>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<App />} />

        <Route path="/login" element={
          <GuestRoute>
            <Login />
          </GuestRoute>
        } />

        <Route path="/forgot-password" element={
          <GuestRoute>
            <ForgotPassword />
          </GuestRoute>
        } />

        <Route path="/register" element={
          <GuestRoute>
            <Register />
          </GuestRoute>
        } />

        <Route path="/reset-password/:token" element={
          <GuestRoute>
            <ResetPassword />
          </GuestRoute>
        } />

        <Route path="/forbidden" element={<Forbidden />} />

        <Route path="/upload" element={
          <RoleProtectedRoute allowedRoles={['Candidat']}>
            <Upload />
          </RoleProtectedRoute>
        } />

        <Route path="/historique" element={
          <RoleProtectedRoute allowedRoles={['Candidat']}>
            <Historique />
          </RoleProtectedRoute>
        } />

        <Route path="/profil-description" element={
          <RoleProtectedRoute allowedRoles={['Recruteur']}>
            <Profile />
          </RoleProtectedRoute>
        } />

        <Route path="/recommendation" element={
          <RoleProtectedRoute allowedRoles={['Candidat']}>
            <Recommendation />
          </RoleProtectedRoute>
        } />

        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <BrowserRouter>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </BrowserRouter>
);