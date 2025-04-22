import React from 'react';
import { Link } from 'react-router-dom';
import './Style.css';

const Forbidden = () => {
  return (
    <div className="style-page">
      <div className="style-content">
        <h1>Accès interdit</h1>
        <p>Vous n'avez pas l'autorisation d'accéder à cette page.</p>
        <Link to="/" className="style-btn">Retour à l'accueil</Link>
      </div>
    </div>
  );
};

export default Forbidden;