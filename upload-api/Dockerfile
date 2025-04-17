FROM node:23-slim

# Installer les dépendances système
RUN apt-get update && apt-get install -y \
    python3 python3-pip \
    tesseract-ocr \
    tesseract-ocr-fra \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
COPY python/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

# Créer dossier pour NLTK
RUN mkdir -p /usr/share/nltk_data

# Installer les dépendances Node.js
WORKDIR /app
COPY . /app
RUN npm install

#* Variables d'environnement
ENV TESSERACT_CMD=/usr/bin/tesseract
ENV PYTHONIOENCODING=utf-8
ENV NLTK_DATA=/usr/share/nltk_data

# Télécharger les stopwords NLTK une seule fois au build
RUN python3 -m nltk.downloader -d /usr/share/nltk_data stopwords

# Port & commande
EXPOSE 3001

# RUN mkdir -p uploads && chmod -R 777 uploads
CMD ["node", "server.js"]