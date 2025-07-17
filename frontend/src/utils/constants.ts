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
