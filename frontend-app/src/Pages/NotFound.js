import React from 'react';
import { Link } from 'react-router-dom';
import './Style.css';

const NotFound = () => {
  return (
    <div className="style-page">
      <div className="style-content">
        <h1>Page non trouvée</h1>
        <p>La page que vous recherchez n'existe pas.</p>
        <Link to="/" className="style-btn">Retour à l'accueil</Link>
      </div>
    </div>
  );
};

export default NotFound;