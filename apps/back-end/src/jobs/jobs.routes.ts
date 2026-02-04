import { Router } from 'express';
import { createJob, getJobs, getJobById, getMyJobs, removeTemplate } from './jobs.controller';
import { authenticate } from '../middleware/auth.middleware';


const router = Router();

router.get('/', getJobs);
router.get('/my', authenticate, getMyJobs);
router.post('/', authenticate, createJob);
router.get('/:id', getJobById);
router.delete(
  '/template/:id',
  authenticate,
  removeTemplate,
);
export default router;
