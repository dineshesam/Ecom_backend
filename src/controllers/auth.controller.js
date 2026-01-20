
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

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'currentPassword and newPassword are required' });
    }

    // You should have requireAuth middleware that sets req.user (id, role, etc)
    const users = await readJSON(USERS_FILE);
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: 'Current password is incorrect' });

    // Optional: enforce password policy (length, complexity, etc.)
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters' });
    }

    // Hash and update
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.updatedAt = new Date().toISOString();

    await writeJSON(USERS_FILE, users);

    // Optional: return a fresh JWT to rotate credentials
    return res.json({ message: 'Password changed successfully' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
};


export const updateName = async (req, res) => {
  try {
    const { name } = req.body;

    // Basic validation
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ message: 'name is required' });
    }

    const trimmed = name.trim();
    if (trimmed.length < 2) {
      return res.status(400).json({ message: 'name must be at least 2 characters' });
    }
    if (trimmed.length > 100) {
      return res.status(400).json({ message: 'name is too long' });
    }

    // Load users and find current user (requireAuth must set req.user.id)
    const users = await readJSON(USERS_FILE);
    const user = users.find(u => u.id === req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

       // If no change, short-circuit
    if (user.name === trimmed) {
      return res.status(200).json({ message: 'Name unchanged', user: { id: user.id, name: user.name, email: user.email, role: user.role } });
    }

    // Update and persist
    user.name = trimmed;
    user.updatedAt = new Date().toISOString();
    await writeJSON(USERS_FILE, users);

    // Return updated safe user
    return res.json({
      message: 'Name updated successfully',
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}


