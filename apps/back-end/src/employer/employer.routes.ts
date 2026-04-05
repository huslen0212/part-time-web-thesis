import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getEmployerProfile,
  updateEmployerProfile,
  getPublicEmployerProfile,
} from './employer.controller';

const router = Router();

router.get('/:id', getPublicEmployerProfile);
router.get('/', authenticate, getEmployerProfile);
router.put('/', authenticate, updateEmployerProfile);

export default router;