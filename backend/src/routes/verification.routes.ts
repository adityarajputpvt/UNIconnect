import { Router } from 'express';
import {
  getPendingVerifications, reviewAchievement,
  getVerificationHistory, getVerificationStats,
} from '../controllers/verification.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('FACULTY', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN'));

router.get('/pending', getPendingVerifications);
router.get('/stats', getVerificationStats);
router.get('/:achievementId/history', getVerificationHistory);
router.post('/:id/review', reviewAchievement);

export default router;
