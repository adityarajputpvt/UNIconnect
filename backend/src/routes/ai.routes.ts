import { Router } from 'express';
import { chatWithAura, getRecommendations, analyzeProfile } from '../controllers/ai.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/chat', chatWithAura);
router.get('/recommendations', getRecommendations);
router.get('/analyze-profile', analyzeProfile);

export default router;
