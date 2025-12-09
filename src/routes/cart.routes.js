
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isUser } from '../middleware/roles.js';
import { getCart, addToCart, updateCartItem, clearCart, removeCartItem } from '../controllers/cart.controller.js';

const router = Router();
router.use(requireAuth, isUser);
router.get('/', getCart);
router.post('/', addToCart);
router.patch('/', updateCartItem);
router.delete('/:productId', removeCartItem);
router.delete('/', clearCart);
export default router;
