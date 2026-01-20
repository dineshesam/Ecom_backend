
import { Router } from 'express';
import { register, login, me, changePassword,updateName } from '../controllers/auth.controller.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.post('/register', register);
router.post('/login', login);
router.get('/me', requireAuth, me);
router.post('/change-password', requireAuth, changePassword);
router.patch('/update-name', requireAuth, updateName)
export default router;
