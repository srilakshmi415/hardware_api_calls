const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors("*"));
// ---- storage helpers -------------------------------------------------

function readData() {
  if (!fs.existsSync(DATA_FILE)) return [];
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Failed to read data.json, starting fresh:', err.message);
    return [];
  }
}

function writeData(records) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(records, null, 2));
}

// ---- POST: hardware team sends readings here --------------------------
// Example body:
// {
//   "deviceId": "sensor-01",
//   "temperature": 42.5,
//   "status": "ok"
// }
app.post('/api/addhardware-data', (req, res) => {
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }

  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    receivedAt: new Date().toISOString(),
    ...payload,
  };

  const records = readData();
  records.push(record);
  writeData(records);

  res.status(201).json({ message: 'Data saved', record });
});

// ---- GET: view all submitted data in the browser (JSON) --------------
app.get('/api/gethardware-data', (req, res) => {
  const records = readData();
  res.json(records);
});

// ---- GET: human-friendly UI (public/index.html) polls the JSON API ----
// and renders it live in the browser. Served automatically by
// express.static('public') above at '/'.

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`POST data to: http://localhost:${PORT}/api/hardware-data`);
  console.log(`View data at: http://localhost:${PORT}/  (or /api/hardware-data for raw JSON)`);
});
