import { Router } from 'express';
import {
  createRating,
  getPendingRatings,
  getUserRating,
  getMyRatingDetails,
  getRatingsByUserId,
} from './ratings.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.post('/', authenticate, createRating);
router.get('/pending', authenticate, getPendingRatings);
router.get('/me', authenticate, getUserRating);
router.get('/me/details', authenticate, getMyRatingDetails);
router.get('/user/:id', authenticate, getRatingsByUserId);

export default router;
