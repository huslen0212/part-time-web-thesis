import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import {
  getEmployerProfile,
  updateEmployerProfile,
} from './employer.controller';

const router = Router();

router.get('/', authenticate, getEmployerProfile);
router.put('/', authenticate, updateEmployerProfile);

export default router;