import { Router } from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  getMyJobs,
  removeTemplate,
  getNearbyJobs,
  getMatchingSeekers,
  inviteSeeker,
  getMyJobStatus,
  getMyPastWorkers,
} from './jobs.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getJobs);
router.get('/my', authenticate, getMyJobs);
router.get('/my-past-workers', authenticate, getMyPastWorkers);
router.get('/nearby', getNearbyJobs);
router.get('/:id/seekers', authenticate, getMatchingSeekers);
router.get('/:id/my-status', authenticate, getMyJobStatus);
router.post('/:id/invite/:seekerId', authenticate, inviteSeeker);
router.get('/:id', getJobById);
router.post('/', authenticate, createJob);
router.delete('/template/:id', authenticate, removeTemplate);

export default router;