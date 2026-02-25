import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  removeTemplate,
  getNearbyJobs,
} from './jobs.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getJobs);
router.get('/my', authenticate, getMyJobs);
router.get('/nearby', getNearbyJobs);
router.get('/:id', getJobById);
router.post('/', authenticate, createJob);
router.delete('/template/:id', authenticate, removeTemplate);

export default router;