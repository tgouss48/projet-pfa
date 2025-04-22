import { getCleanedCVText, recommendJobs, saveActionInHistory } from '../Services/authService';
import React, { useState, useEffect } from 'react';
import './Recommendation.css';
import Navbar from '../NavBar/NavBar';
import {
  FaBuilding,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaGraduationCap,
  FaBriefcase,
  FaFileContract,
} from 'react-icons/fa';

const Recommendations = () => {
  const [jobs, setJobs] = useState([]);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const [loading, setLoading] = useState(true);

  const toggleDetails = async (id, job) => {
    if (expandedJobId !== id) {
      setExpandedJobId(id); 

      try {
        await saveActionInHistory(job._id, 'Consulté', job.score);
      } catch (error) {
        console.error('Erreur lors de l’enregistrement historique:', error);
      }
    } else {
      setExpandedJobId(null);
    }
  };  

  const handleApply = async (job) => {
    try {
      await saveActionInHistory(job._id, 'Postulé', job.score);
      window.open(job.Lien, "_blank");
    } catch (error) {
      console.error('Erreur lors de la candidature:', error);
    }
  };

  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const cleanedText = await getCleanedCVText();
        const recommendRes = await recommendJobs(cleanedText);

        if (recommendRes.length > 0) {
          setJobs(recommendRes);
        } else {
          setJobs([]);
        }
      } catch (error) {
        console.error('Erreur récupération recommandations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecommendations();
  }, []);

  if (loading) {
    return (
      <div className="recommend-spinner-container">
        <div className="recommend-spinner"></div>
      </div>
    );
  }

  const links = [{ path: '/historique', label: 'Historique' }];

  return (
    <>
      <Navbar links={links} showLogout={true} />
      <div className="recommendations-container">
        <h2 className="recommendation-title">Offres recommandées pour vous</h2>

        <div className="job-list">
          {jobs.length > 0 ? jobs.map((job, index) => (
            <div key={index} className="job-card">
              {/* Badge Score */}
              {typeof job.score !== 'undefined' && (
                <div className="score-badge">
                  {Math.round(job.score)}%
                </div>
              )}

              <h3 className="job-title">{job.Titre}</h3>

              <div className="job-info">
                <div className="job-line">
                  <FaBuilding className="icon" />
                  <span>{job.Entreprise}</span>
                </div>

                <div className="job-line">
                  <FaMapMarkerAlt className="icon" />
                  <span>{job.Région}</span>
                </div>
              </div>

              {expandedJobId === index && (
                <div className="details-section">
                  <div className="details-grid">
                    <div className="job-line">
                      <FaBriefcase className="icon" />
                      <span><strong>Expérience :</strong> {job.Expérience || 'Non spécifié'}</span>
                    </div>
                    <div className="job-line">
                      <FaGraduationCap className="icon" />
                      <span><strong>Études :</strong> {job.Études || 'Non spécifié'}</span>
                    </div>
                    <div className="job-line">
                      <FaCalendarAlt className="icon" />
                      <span><strong>Date :</strong> {job.Date || 'Non spécifié'}</span>
                    </div>
                    <div className="job-line">
                      <FaFileContract className="icon" />
                      <span><strong>Contrat :</strong> {job['Type de contrat'] || 'Non spécifié'}</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="button-row">
                <button
                  className="detail-button"
                  onClick={() => toggleDetails(index, job)}
                >
                  {expandedJobId === index ? 'Masquer' : 'Consulter'}
                </button>

                <button className="apply-button" onClick={() => handleApply(job)}>
                  Postuler
                </button>
              </div>
            </div>
          )) : (
            <p style={{ textAlign: "center", marginTop: "20px" }}>Aucune recommandation disponible.</p>
          )}

        </div>
      </div>
    </>
  );
};

export default Recommendations;