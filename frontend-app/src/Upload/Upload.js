import React, { useEffect, useState, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { uploadCV, isValidPDF } from '../Services/UploadCondition';
import { FaCloudUploadAlt } from 'react-icons/fa';
import 'react-toastify/dist/ReactToastify.css';
import './Upload.css';

const Upload = () => {
  const [username, setUsername] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const storedName = localStorage.getItem('username');
    if (storedName) {
      setUsername(storedName);
    }
  }, []);

  const handleClick = () => {
    if (!isUploading) {
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
  
    try {
      setIsUploading(true);
      await uploadCV(file);
      toast.success('CV envoyé avec succès !', {
        position: "bottom-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        theme: "colored"
      });
      setTimeout(() => navigate('/historique'), 2000);
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Erreur lors de l'envoi du CV.");
    } finally {
      setIsUploading(false);
    }
  };  

  const handleDrop = async (event) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files[0];
    if (!file) return;

    if (!isValidPDF(file)) {
      toast.error("Erreur : Seuls les fichiers PDF (moins de 5MB) sont acceptés.");
      return;
    }

    try {
      setIsUploading(true);
      const uploadResult = await uploadCV(file);
      if (uploadResult) {
        toast.success('CV envoyé avec succès !', {
          position: "bottom-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          theme: "colored"
        });
        setTimeout(() => navigate('/historique'), 2000);
      }
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l'envoi du CV.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <>
      <ToastContainer />
      
      <div className="home-container">
        <div
          className={`upload-feature-card ${isDragging ? 'dragging' : ''}`}
          onClick={handleClick}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          style={{ cursor: isUploading ? 'not-allowed' : 'pointer' }}
        >
          <h1 className="welcome-text">Bienvenue {username || '👋'}</h1>
          <p className="instruction-text">Veuillez charger votre CV pour commencer l'aventure</p>

          {isUploading ? (
            <div className="loader"></div>
          ) : (
            <>
              <FaCloudUploadAlt size={40} style={{ marginBottom: '12px', color: "#9c27b0" }} />
              <p style={{ fontSize: "1.1rem", color: "#7b1fa2", fontWeight: "600" }}>
                {isDragging ? "Déposez votre CV ici" : "Cliquez ou glissez pour déposer votre CV"}
              </p>
            </>
          )}

          <input
            type="file"
            accept=".pdf"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {/* Cartes infos */}
        <div className="small-feature-cards">
          <div className="small-feature-card">
            <h3>Format PDF</h3>
            <p>Pour une bonne mise en page</p>
          </div>
          <div className="small-feature-card">
            <h3>5MB max</h3>
            <p>Taille optimale recommandée</p>
          </div>
          <div className="small-feature-card">
            <h3>CV optimal</h3>
            <p>Clair, concis et impactant</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default Upload;