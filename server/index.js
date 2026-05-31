// server/index.js — CabsOnline Express backend using JSON file storage
// No native dependencies required: just Node.js + express + cors

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve React build
app.use(express.static(path.join(__dirname, '../client/dist')));

// ── JSON file-based persistence ────────────────────────────────────────────
const DB_PATH = path.join(__dirname, 'db.json');

function readDB() {
  if (!fs.existsSync(DB_PATH)) {
    const initial = {
      bookings: [],
      drivers: [
        { driver_id: 'DRV001', name: 'James Taufa',     vehicle: 'Toyota Camry',    plate: 'ABC123', status: 'available' },
        { driver_id: 'DRV002', name: 'Priya Sharma',    vehicle: 'Honda Accord',    plate: 'DEF456', status: 'available' },
        { driver_id: 'DRV003', name: 'Mark Chen',       vehicle: 'Ford Mondeo',     plate: 'GHI789', status: 'available' },
        { driver_id: 'DRV004', name: 'Aotea Williams',  vehicle: 'Hyundai Sonata',  plate: 'JKL012', status: 'available' },
      ]
    };
    fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
}

// ── Helpers ────────────────────────────────────────────────────────────────
function generateBRN(db) {
  return 'BRN' + String(db.bookings.length + 1).padStart(5, '0');
}

function parsePickupDT(date, time) {
  const parts = date.split('/');
  if (parts.length !== 3) return null;
  return new Date(+parts[2], +parts[1]-1, +parts[0], +time.split(':')[0], +time.split(':')[1]);
}

// ── Booking ────────────────────────────────────────────────────────────────
app.post('/api/booking', (req, res) => {
  const { cname, phone, unumber, snumber, stname, sbname, dsbname, date, time } = req.body;
  if (!cname || !phone || !snumber || !stname || !date || !time)
    return res.json({ status: 'error', message: 'Missing required fields.' });
  if (!/^\d{10,12}$/.test(phone))
    return res.json({ status: 'error', message: 'Phone must be 10–12 digits.' });

  const db = readDB();
  const brn = generateBRN(db);
  const booking = {
    booking_ref: brn, cname, phone,
    unumber: unumber||'', snumber, stname,
    sbname: sbname||'', dsbname: dsbname||'',
    pickup_date: date, pickup_time: time,
    booking_datetime: new Date().toISOString(),
    status: 'unassigned', driver_id: null, driver_name: null
  };
  db.bookings.push(booking);
  writeDB(db);
  res.json({ status: 'success', brn, date, time });
});

// ── Admin ──────────────────────────────────────────────────────────────────
app.post('/api/admin/search', (req, res) => {
  const db = readDB();
  const bsearch = (req.body.bsearch || '').trim();
  if (bsearch) {
    res.json(db.bookings.filter(b => b.booking_ref === bsearch));
  } else {
    const now = new Date();
    const cutoff = new Date(now.getTime() + 2*60*60*1000);
    res.json(db.bookings.filter(b => {
      if (b.status !== 'unassigned') return false;
      const dt = parsePickupDT(b.pickup_date, b.pickup_time);
      return dt && dt >= now && dt <= cutoff;
    }));
  }
});

app.post('/api/admin/assign', (req, res) => {
  const { brn } = req.body;
  const db = readDB();
  const driver = db.drivers.find(d => d.status === 'available');
  if (!driver) return res.json({ status: 'error', message: 'No drivers available.' });

  const booking = db.bookings.find(b => b.booking_ref === brn);
  if (!booking) return res.json({ status: 'error', message: 'Booking not found.' });

  booking.status = 'assigned';
  booking.driver_id = driver.driver_id;
  booking.driver_name = driver.name;
  driver.status = 'on-trip';
  writeDB(db);
  res.json({ status: 'success', brn, driver_name: driver.name, driver_id: driver.driver_id });
});

app.get('/api/admin/all', (req, res) => {
  const db = readDB();
  res.json([...db.bookings].reverse());
});

// ── Drivers ────────────────────────────────────────────────────────────────
app.get('/api/drivers', (req, res) => {
  res.json(readDB().drivers);
});

app.get('/api/driver/:driverID/jobs', (req, res) => {
  const db = readDB();
  res.json(db.bookings.filter(b => b.driver_id === req.params.driverID).reverse());
});

app.post('/api/driver/:driverID/complete', (req, res) => {
  const { brn } = req.body;
  const db = readDB();
  const booking = db.bookings.find(b => b.booking_ref === brn && b.driver_id === req.params.driverID);
  if (booking) booking.status = 'completed';
  const driver = db.drivers.find(d => d.driver_id === req.params.driverID);
  if (driver) driver.status = 'available';
  writeDB(db);
  res.json({ status: 'success' });
});

// ── Cancel ─────────────────────────────────────────────────────────────────
app.post('/api/cancel', (req, res) => {
  const { brn } = req.body;
  const db = readDB();
  const booking = db.bookings.find(b => b.booking_ref === brn);
  if (!booking) return res.json({ status: 'error', message: 'Booking not found.' });
  if (booking.status !== 'unassigned') return res.json({ status: 'error', message: `Cannot cancel a ${booking.status} booking.` });
  booking.status = 'cancelled';
  writeDB(db);
  res.json({ status: 'success' });
});

// ── Tracking ───────────────────────────────────────────────────────────────
app.get('/api/track/:brn', (req, res) => {
  const db = readDB();
  const booking = db.bookings.find(b => b.booking_ref === req.params.brn);
  if (!booking) return res.json({ status: 'not_found' });
  res.json({ status: 'found', booking });
});

// ── Fallback ───────────────────────────────────────────────────────────────
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/dist/index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.send('Run `npm run build` in the client folder first, or use the dev server.');
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`CabsOnline server → http://localhost:${PORT}`));
