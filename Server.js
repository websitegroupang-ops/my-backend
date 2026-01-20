// server.js

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// ---------------- MIDDLEWARE ----------------
app.use(cors()); // ✅ FIX 1: ENABLE CORS
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ---------------- USERS ----------------
const USERS = [
  { email: 'test@gmail.com', password: '1234', isAdmin: false },
  { email: 'tristan@gmail.com', password: 'sayap', isAdmin: false },
  { email: 'admin@gmail.com', password: 'admin', isAdmin: true },
];

// ---------------- DATA ----------------
const DATA_FILE = path.join(__dirname, 'reservations.json');
let RESERVATIONS = [];

// Load reservations from file
if (fs.existsSync(DATA_FILE)) {
  try {
    RESERVATIONS = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading reservations.json:', err);
  }
}

// ---------------- LOGIN ----------------
app.post('/login', (req, res) => {
  const { email, password } = req.body;

  const user = USERS.find(
    u => u.email === email && u.password === password
  );

  if (user) {
    res.json({ success: true, isAdmin: user.isAdmin });
  } else {
    res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
});

// ---------------- GET RESERVATIONS ----------------
app.get('/api/reservations', (req, res) => {
  res.json(RESERVATIONS);
});

// ---------------- ADD RESERVATION ----------------
app.post('/api/reservations', (req, res) => {
  const { lab, date, hour, note } = req.body;

  if (!lab || !date || !hour) {
    return res.status(400).json({ error: 'Lab, date, and hour are required' });
  }

  const conflict = RESERVATIONS.find(
    r => r.lab === lab && r.date === date && r.hour === hour
  );

  if (conflict) {
    return res.status(400).json({ error: 'Time slot already reserved' });
  }

  const newReservation = { lab, date, hour, note: note || '' };
  RESERVATIONS.push(newReservation);

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(RESERVATIONS, null, 2));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to save reservation' });
  }

  res.json({ success: true, reservation: newReservation });
});

// ---------------- DELETE RESERVATION ----------------
app.delete('/api/reservations', (req, res) => {
  const { lab, date, hour } = req.body;

  const index = RESERVATIONS.findIndex(
    r => r.lab === lab && r.date === date && r.hour === hour
  );

  if (index === -1) {
    return res.status(404).json({ error: 'Reservation not found' });
  }

  const removed = RESERVATIONS.splice(index, 1)[0];

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(RESERVATIONS, null, 2));
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update reservations' });
  }

  res.json({ success: true, reservation: removed });
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT || 3000; // ✅ FIX 2
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

