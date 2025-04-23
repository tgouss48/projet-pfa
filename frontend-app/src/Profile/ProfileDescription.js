import React, { useState } from 'react';
import './ProfileDescription.css';
import Navbar from '../NavBar/NavBar';
import { FaUser, FaTimes } from 'react-icons/fa';
import { toast } from 'react-toastify';
import { generateRecommended, fetchCvPreview } from '../Services/authService';

const ProfileDescription = () => {
  const [description, setDescription] = useState('');
  const [candidats, setCandidats] = useState([]);
  const [selectedCvDataUrl, setSelectedCvDataUrl] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingCvIndex, setLoadingCvIndex] = useState(null); // 👈 ici

  const handleGenerateProfiles = async () => {
    if (!description.trim()) return;

    setIsLoading(true);

    try {
      const profils = await generateRecommended(description);
      setCandidats(profils);
    } catch (error) {
      console.error('Erreur lors de la génération:', error);
      setCandidats([]);
      toast.error("Erreur lors de la génération de profils");
    } finally {
      setIsLoading(false);
    }
  };

  const openCvPopup = async (cvUrl, index) => {
    try {
      setLoadingCvIndex(index);
      const cvDataUrl = await fetchCvPreview(cvUrl);
      setSelectedCvDataUrl(cvDataUrl);
    } catch (error) {
      console.error("Erreur lors de l'affichage du CV:", error);
      toast.error("Erreur lors de l'affichage du CV");
    } finally {
      setLoadingCvIndex(null);
    }
  };

  const closeCvPopup = () => {
    setSelectedCvDataUrl(null);
  };

  const links = [];

  return (
    <>
      <Navbar links={links} showLogout={true} />
      <div className="recruteur-container">
        <div className="recruteur-header">
          <h2 className="recruteur-title">
            Profitez de la magie de CareerCompass,<br /> trouvez des profils parfaitement adaptés à vos attentes
          </h2>

          <div className="recruteur-search-container">
            <textarea
              placeholder="Décrivez ici votre offre d'emploi"
              className="recruteur-search-textarea"
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button className="recruteur-generate-button" onClick={handleGenerateProfiles} disabled={isLoading}>
              {isLoading ? (
                <div className="recruteur-spinner"></div>
              ) : (
                "Générer Profils"
              )}
            </button>
          </div>
        </div>

        <div className="recruteur-candidat-list">
          {candidats.map((candidat, index) => (
            <div key={index} className="recruteur-candidat-card">
              <div className="recruteur-row-between">
                <p className="recruteur-candidat-name">
                  <FaUser className="recruteur-icon" /> {candidat.userName}
                </p>
                <button
                  className="recruteur-show-cv-btn"
                  onClick={() => openCvPopup(candidat.cvUrl, index)}
                  disabled={loadingCvIndex === index}
                >
                  {loadingCvIndex === index ? (
                    <div className="recruteur-small-spinner"></div>
                  ) : (
                    "Afficher CV"
                  )}
                </button>
              </div>
              <div className="recruteur-score-section">
                Score : <span className="recruteur-score">{candidat.score}%</span><br />
                Ajouté : {candidat.createdAt}
              </div>
            </div>
          ))}
        </div>

        {selectedCvDataUrl && (
          <div className="recruteur-cv-modal-overlay" onClick={closeCvPopup}>
            <div className="recruteur-cv-modal-content" onClick={(e) => e.stopPropagation()}>
              <button className="recruteur-cv-modal-close" onClick={closeCvPopup}>
                <FaTimes />
              </button>
              <div className="recruteur-cv-iframe-wrapper">
                <iframe src={selectedCvDataUrl} title="CV" className="recruteur-cv-iframe" />
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileDescription;