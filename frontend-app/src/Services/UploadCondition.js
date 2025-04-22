import axios from 'axios';

export const isValidPDF = (file) => {
  const maxSize = 5 * 1024 * 1024; // 5MB
  if (!file) return false;
  return file.name.toLowerCase().endsWith('.pdf') && file.size <= maxSize;
};

export const uploadCV = async (file) => {
  if (!isValidPDF(file)) {
    throw new Error('Format ou taille de fichier invalide.');
  }

  const formData = new FormData();
  formData.append('cv', file);

  const response = await axios.post('/api/cv/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    withCredentials: true,
  });

  if (!response.status === 200) {
    throw new Error('Erreur lors de l\'upload du CV.');
  }

  return true;
};