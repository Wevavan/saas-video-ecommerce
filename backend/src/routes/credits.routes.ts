import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { CreditsController } from '../controllers/credits.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Rate limiting pour les opérations de consommation
const consumeCreditsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // Maximum 10 consommations par minute par IP
  message: {
    success: false,
    message: 'Trop de consommations de crédits. Réessayez dans 1 minute.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rate limiting pour l'ajout de crédits
const addCreditsLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 5, // Maximum 5 ajouts par 5 minutes par IP
  message: {
    success: false,
    message: 'Trop d\'ajouts de crédits. Réessayez dans 5 minutes.'
  }
});

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /api/credits - Obtenir le solde actuel
router.get('/', CreditsController.getCurrentBalance);

// POST /api/credits/consume - Consommer des crédits
router.post('/consume', consumeCreditsLimiter, CreditsController.consumeCredits);

// POST /api/credits/add - Ajouter des crédits (admin/stripe)
router.post('/add', addCreditsLimiter, CreditsController.addCredits);

// GET /api/credits/history - Historique des transactions
router.get('/history', CreditsController.getCreditHistory);

// GET /api/credits/stats - Statistiques globales (admin)
router.get('/stats', CreditsController.getGlobalStats);

export default router;