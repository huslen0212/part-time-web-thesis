import { Router } from 'express';
import {
  createRating,
  getPendingRatings,
  getUserRating,
} from './ratings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createRating);
router.get('/pending', authenticate, getPendingRatings);
router.get('/me', authenticate, getUserRating);


export default router;