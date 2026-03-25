# Étape 1 : Build de l'application Angular
FROM node:20-alpine AS build
WORKDIR /app

# Copie des fichiers de configuration et installation des dépendances
COPY package*.json ./
RUN npm install

# Copie du code source et build
COPY . .
RUN npm run build -- --configuration production

# Étape 2 : Serveur Nginx pour servir l'application
FROM nginx:alpine
# Copie du build Angular (vérifier le chemin exact dans angular.json)
COPY --from=build /app/dist/dailydelp-frontend/browser /usr/share/nginx/html

# Copie de la configuration Nginx personnalisée
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
