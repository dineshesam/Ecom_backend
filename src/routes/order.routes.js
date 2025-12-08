
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isUser, isAdmin } from '../middleware/roles.js';
import { createOrderFromCart, getMyOrders, listAllOrders, updateOrderStatus } from '../controllers/order.controller.js';

const router = Router();
router.post('/', requireAuth, isUser, createOrderFromCart);
router.get('/my', requireAuth, isUser, getMyOrders);
router.get('/', requireAuth, isAdmin, listAllOrders);
router.patch('/:id/status', requireAuth, isAdmin, updateOrderStatus);
export default router;
