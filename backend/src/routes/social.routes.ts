import { Router } from 'express';
import { getFeed, createPost, likePost, addComment, sendKudos } from '../controllers/social.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/feed', getFeed);
router.post('/posts', createPost);
router.post('/posts/:id/like', likePost);
router.post('/posts/:id/comments', addComment);
router.post('/kudos', sendKudos);

export default router;
