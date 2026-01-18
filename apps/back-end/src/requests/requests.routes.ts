import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { createRequest } from './requests.controller';
import { getEmployerRequests } from './requests.controller';
import { getMyRequests } from './requests.controller';
import { updateRequestStatus } from './requests.controller';

const router = Router();

router.post('/', authenticate, createRequest);
router.get('/employer', authenticate, getEmployerRequests);
router.get('/me', authenticate, getMyRequests);
router.patch('/:requestId', authenticate, updateRequestStatus);

export default router;
