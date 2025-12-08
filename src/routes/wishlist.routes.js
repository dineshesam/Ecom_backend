
import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { isUser } from '../middleware/roles.js';
import { getWishlist, addWishlist, removeWishlist } from '../controllers/wishlist.controller.js';

const router = Router();
router.use(requireAuth, isUser);
router.get('/', getWishlist);
router.post('/', addWishlist);
router.delete('/:productId', removeWishlist);
export default router;
