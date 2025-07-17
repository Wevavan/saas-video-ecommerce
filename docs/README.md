# SaaS de Génération Vidéo E-commerce

Un SaaS complet pour générer des vidéos marketing automatisées pour les produits e-commerce.

## 🚀 Fonctionnalités

- ✅ Génération automatique de vidéos produits
- ✅ Templates personnalisables
- ✅ Dashboard analytics
- ✅ Gestion des utilisateurs
- ✅ API RESTful
- ✅ Interface moderne et responsive

## 🛠️ Technologies

### Frontend
- React 18 + TypeScript
- Vite (build tool)
- Tailwind CSS v3
- React Router DOM
- Zustand (state management)

### Backend
- Node.js + Express
- TypeScript
- MongoDB + Mongoose
- JWT Authentication
- Multer (file upload)

## 📦 Installation

### Prérequis
- Node.js 18+
- MongoDB
- npm ou yarn

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## 🏗️ Structure du projet

```
saas-video-ecommerce/
├── frontend/                 # Application React
├── backend/                  # API Node.js
├── shared/                   # Code partagé
├── docs/                     # Documentation
└── README.md
```

## 🔧 Configuration

1. Configurer MongoDB dans `backend/.env`
2. Lancer le backend: `npm run dev`
3. Lancer le frontend: `npm run dev`
4. Accéder à l'application: `http://localhost:3000`

## 📝 Licence

MIT
