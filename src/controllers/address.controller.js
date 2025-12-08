
import { readJSON, writeJSON } from '../util/fileDb.js';

const ADDR_FILE = 'address.json';

function nextId(rows) {
  return rows.length ? Math.max(...rows.map(a => Number(a.id))) + 1 : 1;
}
function pick(body = {}) {
  return {
    name: body.name || '',
    phoneNo: body.phoneNo || '',
    pincode: body.pincode || '',
    state: body.state || '',
    city: body.city || '',
    buildingName: body.buildingName || '',
    area: body.area || '',
    type: body.type || '',
    location: body.location || ''
  };
}

export const listMyAddresses = async (req, res) => {
  const all = await readJSON(ADDR_FILE);
  const mine = all
    .filter(a => a.userId === req.user.id)
    .map(a => ({ id: a.id, ...a.data }));
  res.json(mine);
};

export const createAddress = async (req, res) => {
  const all = await readJSON(ADDR_FILE);
  const now = new Date().toISOString();
  const data = pick(req.body);
  const addr = { id: nextId(all), userId: req.user.id, data, createdAt: now, updatedAt: now };
  all.push(addr);
  await writeJSON(ADDR_FILE, all);
  res.status(201).json({ id: addr.id, ...addr.data });
};

export const updateAddress = async (req, res) => {
  const all = await readJSON(ADDR_FILE);
  const id = Number(req.params.id);
  const idx = all.findIndex(a => Number(a.id) === id && a.userId === req.user.id);
  if (idx < 0) return res.status(404).json({ message: 'Address not found' });
  const now = new Date().toISOString();
  all[idx] = { ...all[idx], data: { ...all[idx].data, ...pick(req.body) }, updatedAt: now };
  await writeJSON(ADDR_FILE, all);
  res.json({ id, ...all[idx].data });
};

export const deleteAddress = async (req, res) => {
  const all = await readJSON(ADDR_FILE);
  const id = Number(req.params.id);
  const idx = all.findIndex(a => Number(a.id) === id && a.userId === req.user.id);
  if (idx < 0) return res.status(404).json({ message: 'Address not found' });
  all.splice(idx, 1);
  await writeJSON(ADDR_FILE, all);
  res.json({ message: 'Deleted' });
};

// Optional admin helper (for ops)
export const listAllAddresses = async (req, res) => {
  const all = await readJSON(ADDR_FILE);
  res.json(all.map(a => ({ id: a.id, userId: a.userId, ...a.data })));
};
