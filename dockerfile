# Base image sécurisée
FROM node:18.20.2-slim

# Créer le répertoire de travail
WORKDIR /usr/src/app

# Copier les dépendances et installer
COPY package*.json ./
RUN npm install

# Copier tout le code source
COPY . .

# Exposer le port
EXPOSE 3000

# Lancer l'application
CMD ["npm", "run", "dev"]
