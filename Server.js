// server.js
const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();

// ---------------- USERS ----------------
const USERS = [
  { email: 'test@gmail.com', password: '1234', isAdmin: false },
  { email: 'nigger@gmail.com', password: 'abcd', isAdmin: false },
  { email: 'tristan@gmail.com', password: 'sayap', isAdmin: false },
  { email: 'admin@gmail.com', password: 'admin', isAdmin: true },
];

// ---------------- DATA ----------------
const DATA_FILE = path.join(__dirname, 'reservations.json');
let RESERVATIONS = [];

// Load reservations from file if it exists
if (fs.existsSync(DATA_FILE)) {
  try {
    RESERVATIONS = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  } catch (err) {
    console.error('Error reading reservations.json:', err);
  }
}

// ---------------- MIDDLEWARE ----------------
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve frontend from separate folder
const frontendPath = path.join(__dirname, '../Frontend');
app.use(express.static(frontendPath));

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// ---------------- LOGIN ----------------
app.post('/login', (req, res) => {
  const { email, password } = req.body;
  console.log('Login attempt:', req.body);

  const user = USERS.find(u => u.email === email && u.password === password);
  if (user) {
    res.json({ success: true, isAdmin: user.isAdmin });
  } else {
    res.json({ success: false, message: 'Invalid email or password' });
  }
});

// ---------------- GET RESERVATIONS ----------------
app.get('/api/reservations', (req, res) => {
  res.json(RESERVATIONS);
});

// ---------------- ADD RESERVATION ----------------
app.post('/api/reservations', (req, res) => {
  console.log('Incoming reservation:', req.body);

  const { lab, date, hour, note } = req.body;
  if (!lab || !date || !hour) {
    return res.status(400).json({ error: 'Lab, date, and hour are required' });
  }

  // Check for conflict
  const conflict = RESERVATIONS.find(r => r.lab === lab && r.date === date && r.hour === hour);
  if (conflict) {
    return res.status(400).json({ error: 'Time slot already reserved' });
  }

  const newReservation = { lab, date, hour, note: note || '' };
  RESERVATIONS.push(newReservation);

  // Save to file
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(RESERVATIONS, null, 2), 'utf-8');
    console.log('Reservation saved:', newReservation);
  } catch (err) {
    console.error('Error writing reservations:', err);
    return res.status(500).json({ error: 'Failed to save reservation' });
  }

  res.json({ status: 'success', reservation: newReservation });
});

// ---------------- DELETE RESERVATION ----------------
app.delete('/api/reservations', (req, res) => {
  console.log('Delete request:', req.body);
  const { lab, date, hour } = req.body;

  const index = RESERVATIONS.findIndex(r => r.lab === lab && r.date === date && r.hour === hour);
  if (index === -1) return res.status(404).json({ error: 'Reservation not found' });

  const removed = RESERVATIONS.splice(index, 1)[0];

  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(RESERVATIONS, null, 2), 'utf-8');
    console.log('Reservation removed:', removed);
  } catch (err) {
    console.error('Error updating reservations:', err);
    return res.status(500).json({ error: 'Failed to update reservations' });
  }

  res.json({ status: 'success', reservation: removed });
});

// ---------------- START SERVER ----------------
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
