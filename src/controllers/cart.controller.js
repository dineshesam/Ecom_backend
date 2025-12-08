
import { readJSON, writeJSON } from '../util/fileDb.js';

const USERS_FILE = 'users.json';
const PRODUCTS_FILE = 'products.json';

export const getCart = async (req, res) => {
  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const products = await readJSON(PRODUCTS_FILE);
  const detailed = (user.cart || []).map(c => {
    const p = products.find(px => Number(px.id) == Number(c.productId));
    return { ...c, product: p || null };
  });
  res.json(detailed);
};

export const addToCart = async (req, res) => {
  const { productId, qty = 1 } = req.body;
  if (productId === undefined) return res.status(400).json({ message: 'productId required' });
  const users = await readJSON(USERS_FILE);
  const products = await readJSON(PRODUCTS_FILE);
  const prod = products.find(p => Number(p.id) == Number(productId) && p.active !== false);
  if (!prod) return res.status(404).json({ message: 'Product not found' });
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.cart ||= [];
  const idx = user.cart.findIndex(c => Number(c.productId) == Number(productId));
  if (idx > -1) user.cart[idx].qty += Number(qty);
  else user.cart.push({ productId: Number(productId), qty: Number(qty) });
  user.updatedAt = new Date().toISOString();
  await writeJSON(USERS_FILE, users);
  res.status(201).json(user.cart);
};

export const updateCartItem = async (req, res) => {
  const { productId, qty } = req.body;
  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const item = (user.cart || []).find(c => Number(c.productId) == Number(productId));
  if (!item) return res.status(404).json({ message: 'Item not in cart' });
  if (qty <= 0) user.cart = user.cart.filter(c => Number(c.productId) != Number(productId));
  else item.qty = Number(qty);
  user.updatedAt = new Date().toISOString();
  await writeJSON(USERS_FILE, users);
  res.json(user.cart);
};

export const clearCart = async (req, res) => {
  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.cart = [];
  user.updatedAt = new Date().toISOString();
  await writeJSON(USERS_FILE, users);
  res.json({ message: 'Cart cleared' });
};
