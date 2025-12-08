
import { readJSON, writeJSON } from '../util/fileDb.js';

const USERS_FILE = 'users.json';
const PRODUCTS_FILE = 'products.json';

export const getWishlist = async (req, res) => {
  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const products = await readJSON(PRODUCTS_FILE);
  const detailed = (user.wishlist || []).map(id => products.find(p => Number(p.id) == Number(id))).filter(Boolean);
  res.json(detailed);
};

export const addWishlist = async (req, res) => {
  const { productId } = req.body;
  const products = await readJSON(PRODUCTS_FILE);
  const prod = products.find(p => Number(p.id) == Number(productId) && p.active !== false);
  if (!prod) return res.status(404).json({ message: 'Product not found' });
  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.wishlist ||= [];
  if (!user.wishlist.some(id => Number(id) == Number(productId))) user.wishlist.push(Number(productId));
  user.updatedAt = new Date().toISOString();
  await writeJSON(USERS_FILE, users);
  res.status(201).json(user.wishlist);
};

export const removeWishlist = async (req, res) => {
  const { productId } = req.params;
  const users = await readJSON(USERS_FILE);
  const user = users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.wishlist = (user.wishlist || []).filter(id => Number(id) != Number(productId));
  user.updatedAt = new Date().toISOString();
  await writeJSON(USERS_FILE, users);
  res.json(user.wishlist);
};
