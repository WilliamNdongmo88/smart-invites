# Étape 1 : image de base
FROM node:20-alpine

# Étape 2 : création du répertoire de travail
WORKDIR /usr/src/app

# Étape 3 : copier les fichiers de config
COPY package*.json ./

# Étape 4 : installer les dépendances
RUN npm install --production

# Étape 5 : copier le reste du code
COPY . .

# Étape 6 : exposer le port
EXPOSE 3000

# Étape 7 : lancer le serveur
CMD ["node", "backend/server.js"]
