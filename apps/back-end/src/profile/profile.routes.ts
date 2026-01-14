import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateMyProfile,
} from './profile.controller';

const router = Router();

router.get('/', authenticate, getMyProfile);
router.put('/', authenticate, updateMyProfile);

export default router;
