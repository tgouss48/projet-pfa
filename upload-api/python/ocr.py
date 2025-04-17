import re
import os
import string
import json
import pdfplumber
import pytesseract
from pdf2image import convert_from_path
import nltk
from nltk.corpus import stopwords

# Lire les variables d'environnement
pytesseract.pytesseract.tesseract_cmd = os.getenv('TESSERACT_CMD', 'tesseract')
nltk_data_path = os.getenv('NLTK_DATA', os.path.expanduser('~/nltk_data'))
nltk.data.path.append(nltk_data_path)

if not os.path.exists(os.path.join(nltk_data_path, 'corpora/stopwords')):
    nltk.download('stopwords', quiet=True)

french_stopwords = set(stopwords.words('french'))

def extraire_texte_cv(pdf_path):
    texte = ''
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            contenu = page.extract_text()
            if contenu:
                texte += contenu + '\n'

    if not texte.strip():
        images = convert_from_path(pdf_path)
        for img in images:
            texte += pytesseract.image_to_string(img, lang='fra') + '\n'

    return texte

def nettoyer_texte(texte):
    texte = texte.encode("utf-8", "ignore").decode("utf-8")
    texte = texte.lower()
    texte = re.sub(r'[^\x00-\x7F\u00C0-\u017F]', ' ', texte)
    texte = re.sub(r'\b(?:\+33|\+212|0)[1-9](?:[\s.\-]?\d{2}){4}\b', '', texte)
    texte = texte.translate(str.maketrans('', '', string.punctuation))
    texte = re.sub(r'\b\d+\b', '', texte)
    mots = texte.split()
    mots_sans_stopwords = [mot for mot in mots if mot not in french_stopwords]

    return " ".join(mots_sans_stopwords)

if __name__ == "__main__":
    import sys
    sys.stdout.reconfigure(encoding='utf-8') 
    chemin_cv = sys.argv[1]
    texte_cv = extraire_texte_cv(chemin_cv)
    texte_nettoye = nettoyer_texte(texte_cv)

    resultat = {
        "texte": texte_cv,
        "texte_nettoye": texte_nettoye
    }

    print(json.dumps(resultat, ensure_ascii=False))