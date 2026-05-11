import { Router } from 'express';
import {
  getProfile, updateProfile, uploadAvatar,
  uploadResume, getPublicPortfolio,
} from '../controllers/profile.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.get('/portfolio/:slug', getPublicPortfolio);
router.get('/:userId', authenticate, getProfile);
router.put('/', authenticate, updateProfile);
router.post('/avatar', authenticate, upload.single('avatar'), uploadAvatar);
router.post('/resume', authenticate, upload.single('resume'), uploadResume);

export default router;
