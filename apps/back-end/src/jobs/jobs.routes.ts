import { Router } from 'express';
import { createJob, getJobs, getJobById } from './jobs.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getJobs);
router.post('/', authenticate, createJob);
router.get('/:id', getJobById);

export default router;
