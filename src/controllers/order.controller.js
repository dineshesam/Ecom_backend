
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
  if (!user.cart || !user.cart.length) return res.status(400).json({ message: 'Cart empty' });

  // Build items & verify stock
  const items = [];
  for (const c of user.cart) {
    const p = products.find(px => Number(px.id) === Number(c.productId));
    if (!p || p.active === false) {
      return res.status(404).json({ message: `Product not found: ${c.productId}` });
    }
    if (Number(p.stock) < Number(c.qty)) {
      return res.status(409).json({ message: `Insufficient stock for ${p.name}` });
    }
    items.push({
      productId: Number(p.id),
      name: p.name,
      price: Number(p.price || 0),
      qty: Number(c.qty || 1)
    });
  }

  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0);

  // --- Address handling: either addressId or inline address (only allowed fields) ---
  let address = null;

  if (req.body.addressId != null) {
    const allAddr = await readJSON(ADDR_FILE);
    const found = allAddr.find(
      a => Number(a.id) === Number(req.body.addressId) && a.userId === req.user.id
    );
    if (!found) {
      return res.status(404).json({ message: 'Address not found for this user' });
    }
    // We stored address as { id, userId, data:{...fields}, createdAt, updatedAt }
    // Embed only the whitelisted fields; add the addressId reference for traceability
    address = { ...pickAddressFields(found.data), addressId: found.id };
  } else if (req.body.address) {
    // Inline address: pick only allowed fields from payload
    address = pickAddressFields(req.body.address);
  }

  if (!address) {
    return res.status(400).json({ message: 'Address required (send addressId or address)' });
  }

  // Decrement stock in products.json
  for (const i of items) {
    const idx = products.findIndex(px => Number(px.id) === Number(i.productId));
    if (idx > -1) {
      products[idx].stock = Number(products[idx].stock || 0) - i.qty;
      products[idx].updatedAt = new Date().toISOString();
    }
  }

  const now = new Date().toISOString();
  const order = {
    id: crypto.randomUUID(),
    userId: user.id,
    items,
    total,
    status: 'pending',
    address, // only allowed fields (plus addressId if sourced from book)
    payment: { method: req.body.paymentMethod || 'cod', txnId: null },
    createdAt: now,
    updatedAt: now
  };

  orders.push(order);
  user.cart = [];
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
