#!/bin/bash

# Script de restructuration automatique pour le SaaS vidéo e-commerce
# À exécuter depuis le dossier racine saas-video-ecommerce

echo "🚀 Début de la restructuration du projet..."

# 1. Créer la nouvelle structure de dossiers
echo "📁 Création de la structure de dossiers..."

# Renommer le dossier principal
mv ecommerce-video-saas frontend

# Créer les dossiers backend et partagés
mkdir -p backend/src/{controllers,models,routes,middleware,services,utils}
mkdir -p shared/{types,utils}
mkdir -p docs

# 2. Restructurer le frontend
echo "🎨 Restructuration du frontend..."

cd frontend

# Créer la structure de composants
mkdir -p src/components/{ui,layout,forms}
mkdir -p src/pages/{auth,dashboard,videos,settings}
mkdir -p src/hooks
mkdir -p src/store
mkdir -p src/services
mkdir -p src/types
mkdir -p src/utils
mkdir -p src/styles

# 3. Créer les fichiers de base des composants UI
echo "🧩 Création des composants de base..."

# Composant Button
cat > src/components/ui/Button.tsx << 'EOF'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import { clsx } from 'clsx'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  children: ReactNode
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md', 
  className, 
  children, 
  ...props 
}: ButtonProps) => {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2'
  
  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500',
    secondary: 'bg-secondary-200 hover:bg-secondary-300 text-secondary-800 focus:ring-secondary-500',
    outline: 'border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 focus:ring-primary-500'
  }
  
  const sizes = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg'
  }
  
  return (
    <button 
      className={clsx(baseClasses, variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </button>
  )
}
EOF

# Composant Modal
cat > src/components/ui/Modal.tsx << 'EOF'
import { ReactNode } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: ReactNode
}

export const Modal = ({ isOpen, onClose, title, children }: ModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          {title && <h2 className="text-xl font-semibold text-gray-900">{title}</h2>}
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <div className="p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
EOF

# Composant Input
cat > src/components/ui/Input.tsx << 'EOF'
import { InputHTMLAttributes, forwardRef } from 'react'
import { clsx } from 'clsx'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={clsx(
            'input-field',
            error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'
EOF

# 4. Créer les composants de layout
echo "🏗️ Création des composants de layout..."

# Header
cat > src/components/layout/Header.tsx << 'EOF'
import { Button } from '@/components/ui/Button'
import { User, Settings, LogOut } from 'lucide-react'

export const Header = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h1 className="text-2xl font-bold text-gradient">VideoSaaS</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Settings size={16} className="mr-2" />
            Paramètres
          </Button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <Button variant="outline" size="sm">
              <LogOut size={16} />
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
EOF

# Sidebar
cat > src/components/layout/Sidebar.tsx << 'EOF'
import { NavLink } from 'react-router-dom'
import { Home, Video, BarChart3, Settings, User } from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Vidéos', href: '/videos', icon: Video },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Profil', href: '/profile', icon: User },
  { name: 'Paramètres', href: '/settings', icon: Settings },
]

export const Sidebar = () => {
  return (
    <div className="w-64 bg-secondary-900 text-white h-full">
      <div className="p-6">
        <h2 className="text-xl font-bold">Navigation</h2>
      </div>
      
      <nav className="mt-6">
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.href}
            className={({ isActive }) =>
              `flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-primary-600 text-white'
                  : 'text-secondary-300 hover:bg-secondary-800 hover:text-white'
              }`
            }
          >
            <item.icon size={20} className="mr-3" />
            {item.name}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
EOF

# 5. Créer les pages principales
echo "📄 Création des pages principales..."

# Page Dashboard
cat > src/pages/dashboard/Dashboard.tsx << 'EOF'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Video, Play, TrendingUp, Users } from 'lucide-react'

export const Dashboard = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600">Vue d'ensemble de votre activité</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vidéos créées</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
            <Video className="w-8 h-8 text-primary-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vues totales</p>
              <p className="text-2xl font-bold text-gray-900">1,234</p>
            </div>
            <Play className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Taux de conversion</p>
              <p className="text-2xl font-bold text-gray-900">3.2%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Clients actifs</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
            <Users className="w-8 h-8 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Dernières vidéos</h3>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center">
                    <Video className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">Vidéo produit {i}</p>
                    <p className="text-sm text-gray-500">Créée il y a {i} jour{i > 1 ? 's' : ''}</p>
                  </div>
                </div>
                <Button size="sm" variant="outline">Voir</Button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Actions rapides</h3>
          <div className="space-y-3">
            <Button className="w-full justify-start">
              <Video className="w-4 h-4 mr-2" />
              Créer une nouvelle vidéo
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <TrendingUp className="w-4 h-4 mr-2" />
              Voir les analytics
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <Settings className="w-4 h-4 mr-2" />
              Gérer les paramètres
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
EOF

# 6. Créer les types TypeScript
echo "🔍 Création des types TypeScript..."

cat > src/types/auth.types.ts << 'EOF'
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface RegisterCredentials {
  name: string
  email: string
  password: string
}
EOF

cat > src/types/video.types.ts << 'EOF'
export interface Video {
  id: string
  title: string
  description?: string
  thumbnail?: string
  url: string
  duration: number
  status: 'processing' | 'completed' | 'failed'
  createdAt: string
  updatedAt: string
  userId: string
  metadata?: {
    resolution: string
    format: string
    size: number
  }
}

export interface VideoState {
  videos: Video[]
  currentVideo: Video | null
  isLoading: boolean
  error: string | null
}

export interface CreateVideoRequest {
  title: string
  description?: string
  template?: string
  settings?: Record<string, any>
}
EOF

# 7. Créer les services API
echo "🔌 Création des services API..."

cat > src/services/api.ts << 'EOF'
import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Intercepteur pour ajouter le token d'authentification
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
EOF

# 8. Créer les hooks personnalisés
echo "🎣 Création des hooks personnalisés..."

cat > src/hooks/useAuth.ts << 'EOF'
import { useState, useEffect } from 'react'
import { User, LoginCredentials, RegisterCredentials } from '@/types/auth.types'
import { api } from '@/services/api'

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Vérifier la validité du token
      checkAuth()
    } else {
      setIsLoading(false)
    }
  }, [])

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me')
      setUser(response.data.user)
    } catch (error) {
      localStorage.removeItem('token')
    } finally {
      setIsLoading(false)
    }
  }

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post('/auth/login', credentials)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur de connexion')
      return { success: false, error: error.response?.data?.message }
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (credentials: RegisterCredentials) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await api.post('/auth/register', credentials)
      const { token, user } = response.data
      localStorage.setItem('token', token)
      setUser(user)
      return { success: true }
    } catch (error: any) {
      setError(error.response?.data?.message || 'Erreur d\'inscription')
      return { success: false, error: error.response?.data?.message }
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('token')
    setUser(null)
  }

  return {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  }
}
EOF

# 9. Créer les utilitaires
echo "🛠️ Création des utilitaires..."

cat > src/utils/constants.ts << 'EOF'
export const APP_NAME = 'VideoSaaS'
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  VIDEOS: '/videos',
  ANALYTICS: '/analytics',
  PROFILE: '/profile',
  SETTINGS: '/settings',
} as const

export const VIDEO_STATUSES = {
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
} as const

export const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB
export const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/avi', 'video/mov']
EOF

# 10. Mettre à jour le App.tsx principal
echo "📝 Mise à jour du App.tsx..."

cat > src/App.tsx << 'EOF'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { Dashboard } from '@/pages/dashboard/Dashboard'
import { useAuth } from '@/hooks/useAuth'

function App() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card max-w-md w-full">
          <h1 className="text-2xl font-bold text-center mb-6">Connexion requise</h1>
          <p className="text-center text-gray-600">
            Veuillez vous connecter pour accéder à l'application.
          </p>
        </div>
      </div>
    )
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/videos" element={<div className="p-6">Vidéos (à implémenter)</div>} />
              <Route path="/analytics" element={<div className="p-6">Analytics (à implémenter)</div>} />
              <Route path="/profile" element={<div className="p-6">Profil (à implémenter)</div>} />
              <Route path="/settings" element={<div className="p-6">Paramètres (à implémenter)</div>} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  )
}

export default App
EOF

# 11. Créer le composant Card manquant
cat > src/components/ui/Card.tsx << 'EOF'
import { ReactNode } from 'react'
import { clsx } from 'clsx'

interface CardProps {
  children: ReactNode
  className?: string
}

export const Card = ({ children, className }: CardProps) => {
  return (
    <div className={clsx('card', className)}>
      {children}
    </div>
  )
}
EOF

# 12. Revenir au dossier parent et créer la structure backend
cd ..

echo "🖥️ Création de la structure backend..."

# Package.json pour le backend
cat > backend/package.json << 'EOF'
{
  "name": "video-saas-backend",
  "version": "1.0.0",
  "description": "Backend API pour le SaaS de génération vidéo",
  "main": "dist/server.js",
  "scripts": {
    "start": "node dist/server.js",
    "dev": "nodemon src/server.ts",
    "build": "tsc",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.5.0",
    "cors": "^2.8.5",
    "helmet": "^7.0.0",
    "dotenv": "^16.3.1",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "multer": "^1.4.5-lts.1",
    "joi": "^17.9.2"
  },
  "devDependencies": {
    "@types/express": "^4.17.17",
    "@types/cors": "^2.8.13",
    "@types/bcryptjs": "^2.4.2",
    "@types/jsonwebtoken": "^9.0.2",
    "@types/multer": "^1.4.7",
    "@types/node": "^20.5.0",
    "typescript": "^5.1.6",
    "nodemon": "^3.0.1",
    "jest": "^29.6.2",
    "@types/jest": "^29.5.4"
  }
}
EOF

# Configuration TypeScript pour le backend
cat > backend/tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Serveur principal
cat > backend/src/server.ts << 'EOF'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import mongoose from 'mongoose'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Middlewares
app.use(helmet())
app.use(cors())
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Video SaaS API is running' })
})

// Connexion MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/video-saas')
    console.log('✅ MongoDB connecté')
  } catch (error) {
    console.error('❌ Erreur de connexion MongoDB:', error)
    process.exit(1)
  }
}

connectDB()

app.listen(PORT, () => {
  console.log(`🚀 Serveur démarré sur le port ${PORT}`)
})
EOF

# Fichier d'environnement exemple
cat > backend/.env.example << 'EOF'
PORT=5000
MONGODB_URI=mongodb://localhost:27017/video-saas
JWT_SECRET=your-super-secret-jwt-key
NODE_ENV=development
EOF

# 13. Créer la documentation
echo "📚 Création de la documentation..."

cat > docs/README.md << 'EOF'
# Documentation du SaaS Vidéo E-commerce

## Vue d'ensemble
Ce SaaS permet de générer des vidéos marketing automatisées pour les produits e-commerce.

## Architecture
- **Frontend**: React + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js + Express + TypeScript + MongoDB
- **Authentification**: JWT
- **Stockage**: MongoDB + File Storage

## Installation

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

## Structure du projet
Voir le fichier principal README.md pour la structure complète.
EOF

# 14. Créer le README principal
cat > README.md << 'EOF'
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
EOF

echo "✅ Restructuration terminée !"
echo ""
echo "🎯 Prochaines étapes :"
echo "1. cd frontend && npm install"
echo "2. cd backend && npm install"
echo "3. Configurer MongoDB dans backend/.env"
echo "4. Lancer le développement avec npm run dev dans chaque dossier"
echo ""
echo "📁 Nouvelle structure créée avec succès !"