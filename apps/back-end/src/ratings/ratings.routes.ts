// apps/back-end/src/ratings/ratings.router.ts

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

router.post('/',              authenticate, createRating);
router.get('/pending',        authenticate, getPendingRatings);
router.get('/me',             authenticate, getUserRating);       // дундаж + тоо
router.get('/me/details',     authenticate, getMyRatingDetails);  // дэлгэрэнгүй жагсаалт
router.get('/user/:id',                     getRatingsByUserId);  // employer-ийн үнэлгээ

export default router;