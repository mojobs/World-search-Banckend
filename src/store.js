import { randomUUID } from 'node:crypto';
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_FILE = join(__dirname, '..', 'data', 'lookups.json');
const MAX_ENTRIES = 500;
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function readAll() {
  if (!existsSync(DATA_FILE)) return [];
  try {
    const raw = readFileSync(DATA_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    const cutoff = Date.now() - MAX_AGE_MS;
    const fresh = parsed.filter((entry) => new Date(entry.timestamp).getTime() >= cutoff);
    if (fresh.length !== parsed.length) writeAll(fresh);

    return fresh;
  } catch (err) {
    console.warn('store: failed to read data file', err);
    return [];
  }
}

function writeAll(entries) {
  try {
    mkdirSync(dirname(DATA_FILE), { recursive: true });
    writeFileSync(DATA_FILE, JSON.stringify(entries, null, 2));
  } catch (err) {
    console.warn('store: failed to write data file', err);
  }
}

/** Returns all recorded lookups, newest first. */
export function getLookupLog() {
  return [...readAll()].reverse();
}

/** Records a country lookup and returns the created entry. */
export function addLookupLogEntry(entry) {
  const full = {
    id: randomUUID(),
    timestamp: new Date().toISOString(),
    ...entry,
  };

  const entries = readAll();
  entries.push(full);
  writeAll(entries.slice(-MAX_ENTRIES));

  return full;
}

/** Deletes all recorded lookups. */
export function clearLookupLog() {
  writeAll([]);
}
