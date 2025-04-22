import React, { useEffect, useRef, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { isValidPDF, uploadCV } from '../Services/UploadCondition';
import { getHistorique, getUserCVInfo } from '../Services/authService';
import './Historique.css';
import Navbar from '../NavBar/NavBar';
import { FaCloudUploadAlt, FaClock } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';

const Historique = () => {
  const [historique, setHistorique] = useState([]);
  const [user, setUser] = useState(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(true);


  const fetchHistory = async () => {
    try {  
      const [resHistory, resCVInfo] = await Promise.all([
        getHistorique(),
        getUserCVInfo()
      ]);
  
      setHistorique(resHistory || []);
      setUser(resCVInfo || null);
    } catch (error) {
      console.error('Erreur récupération historique ou info CV:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleUploadClick = () => {
    if (!uploading) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
  
    if (!isValidPDF(file)) {
      toast.error('Erreur : Seuls les fichiers PDF (moins de 5MB) sont acceptés.');
      return;
    }
  
    setUploading(true);
    
    try {
      await uploadCV(file);
  
      toast.success('CV mis à jour avec succès !', {
        position: "bottom-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored",
      });
  
      await fetchHistory(); 
    } catch (error) {
      console.error('Erreur upload CV:', error);
      toast.error('Erreur lors de l\'envoi du CV.');
    } finally {
      setUploading(false);
    }
  };

  const links = [
    { path: '/recommendation', label: 'Recommandation' },
  ];

  if (loading) {
    return (
      <div className="histo-loading-screen">
        <div className="histo-loader"></div>
      </div>
    );
  }  

  return (
    <>
      <Navbar links={links} showLogout={true} />
      
      <div className="historique-container">
        <div className="card-size">
          <div className="welcome-banner">
            <div className="welcome-texts">
              <h2>Bienvenue, {user?.userName || "Utilisateur"}</h2>
              <p className="update-cv">
                <FaClock style={{ marginRight: '6px' }} />
                {user?.lastUpdateDate ? `CV mis à jour le ${new Date(user.lastUpdateDate).toLocaleDateString()}` : "CV non disponible"}
              </p>
            </div>

            <button
              className="upload-cv-button"
              onClick={handleUploadClick}
              disabled={uploading}
              style={{ cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}
            >
              {uploading ? (
                <div className="btn-spinner"></div>
              ) : (
                <>
                  <FaCloudUploadAlt size={18} style={{ marginRight: '8px' }} />
                  <span>Mettre à jour mon CV</span>
                </>
              )}
            </button>

            <input
              type="file"
              accept=".pdf"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="card-size">
          <div className="header-banner">
            Historique des recommandations
          </div>
        </div>

        <div className="historique-list">
          {historique.length > 0 ? (
            historique.map((job, index) => (
              <div key={index} className="historique-card">
                <div className="row-between">
                  <div>
                    <h3 className="job-title">{job.Titre}</h3>
                    <p className="recommend-date">
                      {job.actionDate ? `Recommandé le ${new Date(job.actionDate).toLocaleDateString()}` : "Date inconnue"}
                    </p>

                    <div className="tags-line">
                      <span className={`status-tag ${job.source?.toLowerCase()}`}>
                        {job.source || 'Inconnu'}
                      </span>
                      <span className="match-tag">Match {job.score || 0}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <p className="no-history">
              Aucun historique trouvé.
            </p>
          )}
        </div>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </>
  );
};

export default Historique;