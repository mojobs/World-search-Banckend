import cors from 'cors';
import express from 'express';
import { addLookupLogEntry, clearLookupLog, getLookupLog } from './store.js';
import { geolocateIp } from './geolocate.js';

const PORT = process.env.PORT || 8787;
const CORS_ORIGIN = process.env.CORS_ORIGIN?.split(',').map((s) => s.trim()) || 'http://localhost:5173';

const app = express();

// Needed so req.ip reflects the real client address (X-Forwarded-For) when
// deployed behind a reverse proxy/load balancer, instead of the proxy's own IP.
app.set('trust proxy', true);

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());

function clientIp(req) {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  // Normalize IPv4-mapped IPv6 addresses (e.g. "::ffff:127.0.0.1") from Node's socket API.
  return ip.startsWith('::ffff:') ? ip.slice(7) : ip;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/lookups', (_req, res) => {
  res.json(getLookupLog());
});

app.post('/api/lookups', async (req, res) => {
  const countryName = req.body?.countryName;
  if (typeof countryName !== 'string' || !countryName.trim()) {
    res.status(400).json({ error: 'countryName is required' });
    return;
  }

  const ip = clientIp(req);
  const geo = await geolocateIp(ip);

  const entry = addLookupLogEntry({ countryName: countryName.trim(), ip, geo });
  res.status(201).json(entry);
});

app.delete('/api/lookups', (_req, res) => {
  clearLookupLog();
  res.status(204).end();
});

app.listen(PORT, () => {
  console.log(`world-search server listening on http://localhost:${PORT}`);
});
