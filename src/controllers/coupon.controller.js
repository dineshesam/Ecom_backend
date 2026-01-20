
import { readJSON, writeJSON } from '../util/fileDb.js';
const COUPONS_FILE = 'coupons.json';

export const listCoupons = async (req, res) => {
  const coupons = await readJSON(COUPONS_FILE);
  res.json(coupons);
};

export const createCoupon = async (req, res) => {
  const coupons = await readJSON(COUPONS_FILE);
  const nextId = coupons.length ? Math.max(...coupons.map(c => c.id)) + 1 : 1;

const coupon = {
  id: nextId,
  code: String(req.body.code).toUpperCase(),
  type: req.body.type === 'fixed' ? 'fixed' : 'percentage', // ✅ fixed line
  value: Number(req.body.value || 0),
  active: true
};

  coupons.push(coupon);
  await writeJSON(COUPONS_FILE, coupons);
  res.status(201).json(coupon);
};

export const validateCoupon = async (req, res) => {
  const { code, cartTotal } = req.body;
  if (!code || !cartTotal) return res.status(400).json({ message: 'code and cartTotal required' });

  const coupons = await readJSON(COUPONS_FILE);
  const coupon = coupons.find(c => c.code === String(code).toUpperCase());
  if (!coupon || !coupon.active) return res.status(404).json({ message: 'Invalid coupon' });

  let discount = 0;
  if (coupon.type === 'percentage') {
    discount = (coupon.value / 100) * cartTotal;
  } else {
    discount = coupon.value;
  }
  const finalTotal = Math.max(0, cartTotal - discount);

  res.json({ valid: true, discount, finalTotal });
}