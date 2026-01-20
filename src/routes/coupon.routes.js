
import { Router } from 'express';
import { listCoupons, createCoupon, validateCoupon } from '../controllers/coupon.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { isAdmin } from '../middleware/roles.js';

const router = Router();

// Public
router.get('/', listCoupons);
router.post('/validate', validateCoupon);

// Admin
router.post('/', requireAuth, isAdmin, createCoupon);
export default router;

