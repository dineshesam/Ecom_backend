
import { readJSON, writeJSON } from '../util/fileDb.js';

const PRODUCTS_FILE = 'products.json';

function toNumber(val) { const n = Number(val); return Number.isFinite(n) ? n : val; }

export const listProducts = async (req, res) => {
  const { q, category, min, max, page = 1, limit = 20 } = req.query;
  const products = await readJSON(PRODUCTS_FILE);
  let filtered = products.filter(p => p.active !== false);

  if (q) filtered = filtered.filter(p => (p.name || '').toLowerCase().includes(String(q).toLowerCase()));
  if (category) filtered = filtered.filter(p => (p.category || '').toLowerCase() === String(category).toLowerCase());
  if (min || max) filtered = filtered.filter(p => {
    const price = Number(p.price || 0);
    return (min ? price >= Number(min) : true) && (max ? price <= Number(max) : true);
  });

  const start = (Number(page) - 1) * Number(limit);
  const items = filtered.slice(start, start + Number(limit));
  res.json({ items, total: filtered.length, page: Number(page), limit: Number(limit) });
};

export const getProduct = async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE);
  const id = Number(req.params.id);
  const p = products.find(x => Number(x.id) == id);
  if (!p) return res.status(404).json({ message: 'Not found' });
  res.json(p);
};

export const createProduct = async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE);
  const now = new Date().toISOString();
  const nextId = (products.length ? Math.max(...products.map(p => Number(p.id))) + 1 : 1);
  const images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? [req.body.images] : []);
  const p = {
    id: nextId,
    name: req.body.name,
    description: req.body.description || '',
    price: Number(req.body.price || 0),
    stock: Number(req.body.stock || 0),
    images,
    category: req.body.category || '',
    active: req.body.active !== false,
    createdAt: now,
    updatedAt: now
  };
  products.push(p);
  await writeJSON(PRODUCTS_FILE, products);
  res.status(201).json(p);
};

export const updateProduct = async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE);
  const id = Number(req.params.id);
  const idx = products.findIndex(x => Number(x.id) == id);
  if (idx < 0) return res.status(404).json({ message: 'Not found' });

  const now = new Date().toISOString();
  const images = Array.isArray(req.body.images) ? req.body.images : (req.body.images ? [req.body.images] : products[idx].images || []);
  const updated = { ...products[idx], ...req.body, images, price: toNumber(req.body.price ?? products[idx].price), stock: toNumber(req.body.stock ?? products[idx].stock), updatedAt: now };
  products[idx] = updated;
  await writeJSON(PRODUCTS_FILE, products);
  res.json(updated);
};

export const deleteProduct = async (req, res) => {
  const products = await readJSON(PRODUCTS_FILE);
  const id = Number(req.params.id);
  const idx = products.findIndex(x => Number(x.id) == id);
  if (idx < 0) return res.status(404).json({ message: 'Not found' });
  products.splice(idx, 1);
  await writeJSON(PRODUCTS_FILE, products);
  res.json({ message: 'Deleted' });
};
