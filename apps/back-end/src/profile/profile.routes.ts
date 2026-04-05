import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateMyProfile,
  getPublicJobSeekerProfile,
} from './profile.controller';

const router = Router();

router.get('/jobseeker/:id', getPublicJobSeekerProfile);
router.get('/', authenticate, getMyProfile);
router.put('/', authenticate, updateMyProfile);

export default router;
