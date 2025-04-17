FROM node:23-slim

RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Installer les dépendances Python
COPY python/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /tmp/requirements.txt

# Préparer le dossier NLTK
RUN mkdir -p /usr/share/nltk_data
ENV NLTK_DATA=/usr/share/nltk_data

# Télécharger les stopwords en français pour NLTK
RUN python3 -m nltk.downloader -d /usr/share/nltk_data stopwords

# Copier l'application Node.js
WORKDIR /app
COPY . /app

# Installer les dépendances Node.js
RUN npm install

# Variables d’environnement
ENV PYTHONIOENCODING=utf-8

EXPOSE 3002

RUN npx test

# Lancer l'application Node.js en mode dev
CMD ["node", "server.js"]