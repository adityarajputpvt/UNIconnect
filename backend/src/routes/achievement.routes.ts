import { Router } from 'express';
import {
  createAchievement, getAchievements, getAchievementById,
  updateAchievement, deleteAchievement, submitForVerification,
  uploadDocument, processOCR,
} from '../controllers/achievement.controller';
import { authenticate } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

router.use(authenticate);

router.get('/', getAchievements);
router.post('/', createAchievement);
router.get('/:id', getAchievementById);
router.put('/:id', updateAchievement);
router.delete('/:id', deleteAchievement);
router.post('/:id/submit', submitForVerification);
router.post('/:id/documents', upload.single('document'), uploadDocument);
router.post('/ocr/process', upload.single('certificate'), processOCR);

export default router;
