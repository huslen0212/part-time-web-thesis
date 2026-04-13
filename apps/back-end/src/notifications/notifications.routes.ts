import { Router } from 'express';
import {
  getMyNotifications,
  markNotificationRead,
  streamNotifications,
} from './notifications.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

router.get('/stream', streamNotifications);
router.get('/', authenticate, getMyNotifications);
router.patch('/:id/read', authenticate, markNotificationRead);

export default router;
