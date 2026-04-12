import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  createRequest,
  getEmployerRequests,
  getMyRequests,
  updateRequestStatus,
  getMyInviteRequests,
  respondToInvite,
} from './requests.controller';

const router = Router();

router.post('/', authenticate, createRequest);
router.get('/employer', authenticate, getEmployerRequests);
router.get('/me', authenticate, getMyRequests);
router.get('/me/invites', authenticate, getMyInviteRequests);
router.patch('/:requestId/invite-response', authenticate, respondToInvite);
router.patch('/:requestId', authenticate, updateRequestStatus);

export default router;
