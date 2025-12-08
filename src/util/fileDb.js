
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.resolve(__dirname, '../data');

async function ensureDir() { await fs.mkdir(dataDir, { recursive: true }); }
async function ensureFile(file, defaultContent = '[]') {
  try { await fs.access(file); } catch { await fs.writeFile(file, defaultContent, 'utf-8'); }
}

export async function readJSON(name) {
  await ensureDir();
  const file = path.join(dataDir, name);
  await ensureFile(file);
  const text = await fs.readFile(file, 'utf-8');
  return JSON.parse(text || '[]');
}

export async function writeJSON(name, obj) {
  await ensureDir();
  const file = path.join(dataDir, name);
  const tmp = file + '.tmp';
  const text = JSON.stringify(obj, null, 2);
  await fs.writeFile(tmp, text, 'utf-8');
  await fs.rename(tmp, file);
}
