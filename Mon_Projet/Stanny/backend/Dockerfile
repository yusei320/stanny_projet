# Utiliser une image de base Node.js légère
FROM node:20-alpine

# Définir le dossier de travail dans le conteneur
WORKDIR /app

# Copier les fichiers package.json et package-lock.json du backend pour installer les dépendances
COPY backend/package*.json ./backend/

# Installer les dépendances du backend
WORKDIR /app/backend
RUN npm ci --only=production

# Copier le frontend et le backend
WORKDIR /app
COPY frontend ./frontend
COPY backend ./backend

# Se positionner dans le dossier du backend pour exécuter l'application
WORKDIR /app/backend

# Exposer le port de l'application (doit correspondre à PORT dans .env)
EXPOSE 3000

# Commande de démarrage
CMD ["npm", "start"]
