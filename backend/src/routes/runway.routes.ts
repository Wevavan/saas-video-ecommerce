// backend/src/routes/runway.routes.ts (fichier manquant)
import { Router } from 'express';
import { RunwayController } from '../controllers/runway.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting spécifique pour Runway (génération coûteuse)
const generateRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 générations par minute
  message: {
    success: false,
    message: 'Trop de générations demandées. Limite: 5 par minute.'
  }
});

// Routes protégées
router.post('/generate', authenticateToken, generateRateLimit, RunwayController.generateVideo);
router.get('/status/:jobId', RunwayController.getGenerationStatus);
router.post('/cancel/:jobId', authenticateToken, RunwayController.cancelGeneration);

// Routes publiques
router.get('/styles', RunwayController.getAvailableStyles);

// Routes admin/stats
router.get('/stats', authenticateToken, RunwayController.getServiceStats);

export default router;