import { Router } from 'express';
import { getStudentDashboard, getFacultyDashboard, getAdminDashboard } from '../controllers/analytics.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.get('/student', authenticate, getStudentDashboard);
router.get('/faculty', authenticate, authorize('FACULTY', 'DEPARTMENT_ADMIN', 'SUPER_ADMIN'), getFacultyDashboard);
router.get('/admin', authenticate, authorize('DEPARTMENT_ADMIN', 'SUPER_ADMIN'), getAdminDashboard);

export default router;
