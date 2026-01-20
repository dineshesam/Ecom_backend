
import { readJSON, writeJSON } from '../util/fileDb.js';
import crypto from 'crypto';

const USERS_FILE = 'users.json';
const PRODUCTS_FILE = 'products.json';
const ORDERS_FILE = 'orders.json';
const ADDR_FILE = 'address.json';

/**
 * Only keep allowed address fields.
 */
function pickAddressFields(obj = {}) {
  return {
    name: obj.name || '',
    phoneNo: obj.phoneNo || '',
    pincode: obj.pincode || '',
    state: obj.state || '',
    city: obj.city || '',
    buildingName: obj.buildingName || '',
    area: obj.area || '',
    type: obj.type || '',
    location: obj.location || ''
  };
}


export const createOrderFromCart = async (req, res) => {
  const users = await readJSON(USERS_FILE);
  const products = await readJSON(PRODUCTS_FILE);
  const orders = await readJSON(ORDERS_FILE);

  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  // ---- Decide source of items: body.items OR user.cart ----
  const bodyItems = Array.isArray(req.body.items) ? req.body.items : null;
  const cartItems = user.cart || [];

  if (!bodyItems && (!cartItems || !cartItems.length)) {
    return res.status(400).json({ message: 'Cart empty' });
  }

  // ---- Build items and verify stock ----
  const items = [];
  const source = bodyItems || cartItems; // [{ productId, qty }]

  for (const c of source) {
    const p = products.find(px => Number(px.id) === Number(c.productId));
    if (!p || p.active === false) {
      return res.status(404).json({ message: `Product not found: ${c.productId}` });
    }
    const qty = Number(c.qty || 1);
    if (Number(p.stock) < qty) {
      return res.status(409).json({ message: `Insufficient stock for ${p.name}` });
    }
    items.push({
      productId: Number(p.id),
      name: p.name,
      price: Number(p.price || 0),
      qty,
      image: Array.isArray(p.images) ? p.images[0] : null  // ✅ help Orders.jsx render images
    });
  }

  // ---- Compute server-side subtotal (original total) ----
  const computedSubtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // ---- Accept client-provided totals (minimal) ----
  const providedTotals = req.body.totals || {};
  const subtotal = Number(providedTotals.subtotal ?? computedSubtotal);
  const discount = Number(providedTotals.discount ?? 0);
  const finalTotal = Number(
    providedTotals.finalTotal ?? Math.max(0, subtotal - discount)
  );
  const couponCode = req.body.couponCode || null;

  // ---- Address handling (unchanged) ----
  let address = null;
  if (req.body.addressId != null) {
    const allAddr = await readJSON(ADDR_FILE);
    const found = allAddr.find(
      a => Number(a.id) === Number(req.body.addressId) && a.userId === req.user.id
    );
    if (!found) {
      return res.status(404).json({ message: 'Address not found for this user' });
    }
    address = { ...pickAddressFields(found.data), addressId: found.id };
  } else if (req.body.address) {
    address = pickAddressFields(req.body.address);
  }
  if (!address) {
    return res.status(400).json({ message: 'Address required (send addressId or address)' });
  }

  // ---- Decrement stock ----
  for (const i of items) {
    const idx = products.findIndex(px => Number(px.id) === Number(i.productId));
    if (idx > -1) {
      products[idx].stock = Number(products[idx].stock || 0) - i.qty;
      products[idx].updatedAt = new Date().toISOString();
    }
  }

  // ---- Create order (persist totals and coupon) ----
  const now = new Date().toISOString();
  const order = {
    id: crypto.randomUUID(),
    userId: user.id,
    items,                                      // includes item.image for UI
    totals: { subtotal, discount, finalTotal }, // ✅ NEW: persisted totals
    total: finalTotal,                          // ✅ legacy field shows discounted total
    couponCode,                                 // ✅ saved for reference
    status: 'pending',
    address,
    payment: { method: req.body.paymentMethod || 'cod', txnId: null },
    createdAt: now,
    updatedAt: now
  };

  orders.push(order);
  // If we created from user's cart, clear it
  if (!bodyItems) {
    user.cart = [];
  }
  user.updatedAt = now;

  await writeJSON(PRODUCTS_FILE, products);
  await writeJSON(USERS_FILE, users);
  await writeJSON(ORDERS_FILE, orders);

  return res.status(201).json(order);

};

export const getMyOrders = async (req, res) => {
  const orders = await readJSON(ORDERS_FILE);
  const mine = orders
    .filter(o => o.userId === req.user.id)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json(mine);
};

export const listAllOrders = async (req, res) => {
  const orders = await readJSON(ORDERS_FILE);
  res.json(orders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
};

export const updateOrderStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const orders = await readJSON(ORDERS_FILE);
  const idx = orders.findIndex(o => o.id === id);
  if (idx < 0) return res.status(404).json({ message: 'Order not found' });
  orders[idx].status = status;
  orders[idx].updatedAt = new Date().toISOString();
  await writeJSON(ORDERS_FILE, orders);
  res.json(orders[idx]);
};
