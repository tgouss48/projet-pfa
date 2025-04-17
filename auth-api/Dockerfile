# Utiliser l'image Node.js 23-slim comme base
FROM node:23-slim

# Installer les dépendances de construction (nécessaires pour bcrypt)
RUN apt-get update && apt-get install -y python3 make g++

# Définir le répertoire de travail
WORKDIR /app

# Copier les fichiers de l'application dans le conteneur
COPY . /app

# Installer les dépendances Node.js
RUN rm -rf node_modules
RUN npm install

# Exposer le port 3000
EXPOSE 3000

# Démarrer l'application
CMD ["node", "index.js"]