// backend/src/routes/index.ts (mise à jour)
import { Router } from 'express';
import authRoutes from './auth.routes';
import usersRoutes from './users.routes';
import videosRoutes from './videos.routes';
import testRoutes from './test.routes';

const router = Router();

// Routes principales
router.use('/auth', authRoutes);
router.use('/users', usersRoutes);
router.use('/videos', videosRoutes);
router.use('/test', testRoutes);

export default router;