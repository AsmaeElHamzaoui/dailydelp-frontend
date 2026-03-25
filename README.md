#  Dailydelp - Plateforme de Coaching & Bien-être

Dailydelp est une plateforme web moderne conçue pour faciliter la gestion du coaching, le suivi des habitudes et l'interaction communautaire. Le projet est bâti avec **Angular 19** et offre une expérience utilisateur premium grâce à une interface soignée et réactive.

##  Fonctionnalités Principales

La plateforme propose trois interfaces distinctes adaptées aux besoins de chaque utilisateur :

###  Espace Utilisateur
- **Tableau de Bord Personnel** : Suivi de progression et activités récentes.
- **Mes Groupes** : Intégration de communautés pour échanger et partager.
- **Suivi d'Habitudes (Habits)** : Outil pour instaurer et suivre des routines quotidiennes.
- **Gestion des Inscriptions** : Suivi des programmes et groupes rejoints.
- **Profil Personnalisé** : Gestion des informations personnelles et préférences.

###  Espace Coach
- **Dashboard Coach** : Vue d'ensemble des activités et des performances des groupes.
- **Gestion des Challenges** : Création et suivi de défis stimulants pour les utilisateurs.
- **Groupes Assignés** : Gestion directe des membres et du contenu des groupes suivis.
- **Gestion de Postes** : Publication de conseils, articles et actualités.

###  Espace Administrateur
- **Administration Globale** : Contrôle total sur la plateforme.
- **Analyses (Analytics)** : Statistiques détaillées sur l'utilisation et la croissance.
- **Gestion des Utilisateurs & Coachs** : Modération et attribution des rôles.
- **Gestion des Groupes & Inscriptions** : Validation et organisation structurelle.

##  Stack Technique

- **Frontend** : [Angular 19](https://angular.io/) (Standalone Components)
- **Styling** : [Bootstrap 5.3](https://getbootstrap.com/) & Bootstrap Icons
- **Visualisation** : [Chart.js](https://www.chartjs.org/) pour les graphiques et analyses.
- **Gestion d'état** : RxJS
- **Formulaires** : Reactive Forms pour une validation robuste.

##  Installation et Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- [Angular CLI](https://angular.io/cli) installée globalement (`npm install -g @angular/cli`)

### Étapes d'installation
1. **Cloner le projet**
   ```bash
   git clone https://github.com/AsmaeElHamzaoui/dailydelp-frontend
   cd dailydelp-frontend
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Lancer le serveur de développement**
   ```bash
   ng serve
   ```
   L'application sera disponible sur `http://localhost:4200/`.

##  Structure du Projet

Le projet suit une architecture modulaire et scalable :
- `src/app/core/` : Services globaux, guards, interceptors et modèles.
- `src/app/shared/` : Composants, directives et pipes réutilisables.
- `src/app/features/` : Modules fonctionnels (Admin, Coach, User, Auth).
- `public/` : Ressources statiques et images.

