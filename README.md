# Green Stock 🌿

Application web de gestion d'inventaire informatique reconditionné, permettant d'analyser l'impact environnemental des actifs informatiques grâce à l'IA.

## 🚀 Fonctionnalités

- **Gestion d'inventaire** : Suivi des actifs informatiques (ordinateurs, écrans, serveurs, etc.).
- **Analyse d'Impact** : Utilisation de l'IA (Groq SDK) pour estimer l'empreinte carbone et l'impact environnemental de chaque équipement.
- **Tableau de Bord** : Vue d'ensemble de l'état du matériel et des économies de CO2 réalisées grâce au reconditionné.

## 🛠️ Installation

### Prérequis

- [Node.js](https://nodejs.org/) (version 18 ou supérieure recommandée)
- Un compte [Groq](https://console.groq.com/) pour obtenir une clé API.

### Configuration

2.  **Installer les dépendances**
    Installez les dépendances pour le backend (racine) et le frontend (`client/`).
    ```bash
    # Backend
    npm install

    # Frontend
    cd client
    npm install
    cd ..
    ```

3.  **Variables d'environnement**
    Créez un fichier `.env` à la racine du projet et ajoutez votre clé API Groq :
    ```dotenv
    GROQ_API_KEY=votre_cle_api_ici
    ```

## 🏃 Démarrage

### Utilisation du script automatique (Windows)

Si vous êtes sur Windows, vous pouvez utiliser le script PowerShell fourni pour lancer le backend et le frontend simultanément :

```powershell
./start.ps1
```

### Démarrage manuel

Si vous préférez lancer les composants séparément :

1.  **Lancer le Backend (Server)**
    ```bash
    npm start
    ```
    Le serveur sera disponible sur `http://localhost:3000`.

2.  **Lancer le Frontend (Vite)**
    ```bash
    cd client
    npm run dev
    ```
    L'application sera disponible sur `http://localhost:5173`.

## 📁 Structure du Projet

- `src/server.js` : Serveur Express gérant l'API et l'intégration avec Groq.
- `client/` : Application frontend Vue.js 3 / Vite.
- `data/` : Stockage des données locales (fichiers JSON).
- `start.ps1` : Script de démarrage rapide pour Windows.
