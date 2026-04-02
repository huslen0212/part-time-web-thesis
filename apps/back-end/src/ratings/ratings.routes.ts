import { Router } from 'express';
import {
  createRating,
  getPendingRatings,
} from './ratings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createRating);

router.get('/pending', authenticate, getPendingRatings);

export default router;