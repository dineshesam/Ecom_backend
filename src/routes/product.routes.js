
import { Router } from 'express';
import { listProducts, getProduct, createProduct, updateProduct, deleteProduct } from '../controllers/product.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();
router.get('/', listProducts);
router.get('/:id', getProduct);
router.post('/', requireAuth, isAdmin, createProduct);
router.patch('/:id', requireAuth, isAdmin, updateProduct);
router.delete('/:id', requireAuth, isAdmin, deleteProduct);
export default router;
