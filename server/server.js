const express = require('express');
const http = require('http');
const cors = require('cors'); // If needed for cross-origin requests
const path = require('path');
const fs = require('fs');
const open = require('open'); // Open browser automatically

const app = express();

// Get the directory where the EXE is running
const getExecutablePath = () => {
  return process.pkg ? path.dirname(process.execPath) : __dirname;
};

// Function to dynamically read config.json from the same directory as the EXE
const getConfig = () => {
  try {
    const configPath = path.join(getExecutablePath(), 'config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('Error reading config.json:', error);
    return { serverIp: 'localhost', serverPort: 8082 }; // Default values
  }
};

// Use built-in JSON parser
app.use(express.json());

// Optionally enable CORS so that your HTML page (on a different port/domain) can fetch
app.use(cors());

// Serve static files (HTML, images, etc.)
app.use(express.static(path.join(__dirname, '../public')));

// Keep a reference to the last received data in memory
let lastTelemetry = null;

// ----------------------
// 1) Endpoint to RECEIVE telemetry data via POST
// ----------------------
app.post('/', (req, res) => {
  const timestamp = new Date().toISOString();
  console.log(`\n${timestamp}`);
  console.log(`Method: ${req.method}`);
  console.log(`URL: ${req.url}`);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);

  // Save the parsed JSON body in memory
  lastTelemetry = req.body;

  // Respond with something (JSON or status)
  res.json({ status: 'ok' });
});

// ----------------------
// 2) Endpoint to SERVE the last known telemetry data via GET
// ----------------------
app.get('/data', (req, res) => {
  if (!lastTelemetry) {
    // No data yet, return a 404 or an empty object
    return res.status(404).json({ error: 'No telemetry data received yet' });
  }
  // Return the last JSON we have
  res.json(lastTelemetry);
});

// Start HTTP server 
const { serverIp, serverPort } = getConfig(); // Read config at startup
http.createServer(app).listen(serverPort, () => {
  console.log(`Server running at http://${serverIp}:${serverPort}`);
  open(`http://${serverIp}:${serverPort}/index.html`);
});
