import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createRequest } from './requests.controller';
import { getEmployerRequests } from './requests.controller';

const router = Router();

router.post('/', authenticate, createRequest);
router.get('/employer', authenticate, getEmployerRequests);


export default router;
