
import { readJSON, writeJSON } from '../util/fileDb.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const USERS_FILE = 'users.json';

function sign(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '1d'
  });
}

export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res.status(400).json({ message: 'name, email, password required' });
    const users = await readJSON(USERS_FILE);
    const exists = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) return res.status(409).json({ message: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();
    const user = {
      id: crypto.randomUUID(),
      name,
      email: email.toLowerCase(),
      passwordHash,
      role: role === 'admin' ? 'admin' : 'user',
      wishlist: [],
      cart: [],
      createdAt: now,
      updatedAt: now
    };
    users.push(user);
    await writeJSON(USERS_FILE, users);
    return res.status(201).json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const users = await readJSON(USERS_FILE);
    const user = users.find(u => u.email.toLowerCase() === (email || '').toLowerCase());
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    return res.json({ token: sign(user), user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const me = async (req, res) => {
  try {
    const users = await readJSON(USERS_FILE);
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    const { passwordHash, ...rest } = user;
    res.json(rest);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
