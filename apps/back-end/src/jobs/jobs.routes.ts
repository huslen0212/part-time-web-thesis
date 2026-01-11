import { Router } from 'express';
import { createJob, getJobs } from './jobs.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/', getJobs);
router.post('/', authenticate, createJob);

export default router;
