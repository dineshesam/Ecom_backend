
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isAdmin, isUser } from '../middleware/roles.js';
import {
  listMyAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  listAllAddresses
} from '../controllers/address.controller.js';

const router = Router();

router.get('/my', requireAuth, isUser, listMyAddresses);
router.post('/', requireAuth, isUser, createAddress);
router.patch('/:id', requireAuth, isUser, updateAddress);
router.delete('/:id', requireAuth, isUser, deleteAddress);

// Optional: for admin debugging
router.get('/', requireAuth, isAdmin, listAllAddresses);

export default router;
