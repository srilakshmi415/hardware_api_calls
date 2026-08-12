const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');
const TEST_RESULTS_FILE = path.join(__dirname, 'test-results.json');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---- storage helpers -------------------------------------------------

function readJson(file) {
  if (!fs.existsSync(file)) return [];
  try {
    const raw = fs.readFileSync(file, 'utf-8');
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error(`Failed to read ${path.basename(file)}, starting fresh:`, err.message);
    return [];
  }
}

function writeJson(file, records) {
  fs.writeFileSync(file, JSON.stringify(records, null, 2));
}

function readData() {
  return readJson(DATA_FILE);
}

function writeData(records) {
  writeJson(DATA_FILE, records);
}

// ---- POST: hardware team sends readings here --------------------------
// Example body:
// {
//   "deviceId": "sensor-01",
//   "temperature": 42.5,
//   "status": "ok"
// }
app.post('/api/hardware-data', (req, res) => {
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

// ---- POST: hardware team sends a device self-test / diagnostic result --
// Example body (meaningful, realistic payload for a board power-on test):
// {
//   "deviceId": "esp32-01",
//   "testName": "power-on-self-test",
//   "result": "pass",              // "pass" | "fail"
//   "firmwareVersion": "1.4.2",
//   "voltage": 3.3,
//   "currentMa": 120,
//   "temperatureC": 27.4,
//   "durationMs": 850,
//   "errorCode": null
// }
app.post('/api/hardware-test-result', (req, res) => {
  const payload = req.body;

  if (!payload || Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'Request body cannot be empty' });
  }
  if (!payload.deviceId || !payload.testName || !payload.result) {
    return res.status(400).json({
      error: 'deviceId, testName and result are required fields',
    });
  }

  const record = {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
    receivedAt: new Date().toISOString(),
    ...payload,
  };

  const records = readJson(TEST_RESULTS_FILE);
  records.push(record);
  writeJson(TEST_RESULTS_FILE, records);

  res.status(201).json({ message: 'Test result saved', record });
});

// ---- GET: view all submitted device test results (JSON) ---------------
app.get('/api/hardware-test-result', (req, res) => {
  const records = readJson(TEST_RESULTS_FILE);
  res.json(records);
});

// ---- GET: human-friendly UI (public/index.html) polls the JSON API ----
// and renders it live in the browser. Served automatically by
// express.static('public') above at '/'.

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`POST data to: http://localhost:${PORT}/api/hardware-data`);
  console.log(`POST test result to: http://localhost:${PORT}/api/hardware-test-result`);
  console.log(`View data at: http://localhost:${PORT}/  (or /api/hardware-data for raw JSON)`);
  console.log(`View test results at: http://localhost:${PORT}/api/hardware-test-result`);
});
