import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getMyProfile,
  updateMyProfile,
  getPublicJobSeekerProfile,
  addAvailability,
  deleteAvailability,
} from './profile.controller';

const router = Router();

router.get('/jobseeker/:id', getPublicJobSeekerProfile);
router.get('/', authenticate, getMyProfile);
router.put('/', authenticate, updateMyProfile);
router.post('/availability', authenticate, addAvailability);
router.delete('/availability/:id', authenticate, deleteAvailability);

export default router;
