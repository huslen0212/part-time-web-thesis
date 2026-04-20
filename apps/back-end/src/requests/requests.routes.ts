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

//huseltüüdtei holbogdoh route-uudiig burtgene
const router = Router();

//ajil haigch huselt ilgeeh
router.post('/', authenticate, createRequest);
//ajil olgogch ooriin ajluudiin huseltüüdiig avah
router.get('/employer', authenticate, getEmployerRequests);
//ajil haigch ooriin huseltüüdiig avah
router.get('/me', authenticate, getMyRequests);
//ajil haigch ooriin invite-uudiig avah
router.get('/me/invites', authenticate, getMyInviteRequests);
//ajil haigch invite-d hariulah (accept/reject)
router.patch('/:requestId/invite-response', authenticate, respondToInvite);
//ajil olgogch huseltiin status solih
router.patch('/:requestId', authenticate, updateRequestStatus);

export default router;
