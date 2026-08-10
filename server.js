const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const DUMMY_DATA_FILE = path.join(__dirname, 'dummy-data.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
      return res.sendStatus(200);
  }
  next();
});
// ---- storage helpers -------------------------------------------------

function readData(file = DATA_FILE) {
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`Failed to read ${path.basename(file)}, starting fresh:`, err.message);
    return [];
  }
}

function writeData(records, file = DATA_FILE) {
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
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

// ---- POST: dummy/testing endpoint --------------------------------------
// Use this to test API calls without touching real hardware data.
// Example body:
// {
//   "test": "hello",
//   "anyField": "anyValue"
// }
app.post('/api/adddata', (req, res) => {
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }

  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    receivedAt: new Date().toISOString(),
    ...payload,
  };

  const records = readData(DUMMY_DATA_FILE);
  records.push(record);
  writeData(records, DUMMY_DATA_FILE);

  res.status(201).json({ message: 'Dummy data saved', record });
});

// ---- GET: view all dummy/testing data --------------------------------
app.get('/api/getdata', (req, res) => {
  const records = readData(DUMMY_DATA_FILE);
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
