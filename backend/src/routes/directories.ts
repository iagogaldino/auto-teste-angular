import { Router } from 'express';
import fs from 'fs';
import path from 'path';

const router = Router();

// Resolve a pasta base de execução (funciona tanto em dev quanto no binário empacotado)
const baseDir = (process as any).pkg ? path.dirname(process.execPath) : path.resolve(__dirname, '..', '..');
const storeFile = path.join(baseDir, 'directories.json');

interface StoreShape {
  directories: string[];
}

function readStore(): StoreShape {
  try {
    if (!fs.existsSync(storeFile)) return { directories: [] };
    const raw = fs.readFileSync(storeFile, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.directories)) return { directories: [] };
    return { directories: parsed.directories.filter((p: unknown) => typeof p === 'string') };
  } catch {
    return { directories: [] };
  }
}

function writeStore(data: StoreShape): void {
  try {
    fs.writeFileSync(storeFile, JSON.stringify({ directories: data.directories }, null, 2), 'utf8');
  } catch {}
}

router.get('/', (_req, res) => {
  const store = readStore();
  res.json({ success: true, directories: store.directories });
});

router.post('/', (req, res) => {
  const dirPath = String(req.body?.path || '').trim();
  if (!dirPath) return res.status(400).json({ success: false, message: 'Path is required' });

  const store = readStore();
  const exists = store.directories.some(p => p.toLowerCase() === dirPath.toLowerCase());
  const updated = exists ? store.directories : [dirPath, ...store.directories].slice(0, 20);
  writeStore({ directories: updated });
  res.json({ success: true, directories: updated });
});

router.delete('/', (req, res) => {
  const dirPath = String(req.body?.path || '').trim();
  if (!dirPath) return res.status(400).json({ success: false, message: 'Path is required' });

  const store = readStore();
  const updated = store.directories.filter(p => p !== dirPath);
  writeStore({ directories: updated });
  res.json({ success: true, directories: updated });
});

export default router;


