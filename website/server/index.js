import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { initDatabase } from './db/index.js';
import homestaysRouter from './routes/homestays.js';
import ownerRouter from './routes/owner.js';
import adminRouter from './routes/admin.js';
import uploadRouter from './routes/upload.js';
import enclavesRouter from './routes/enclaves.js';
import bookingsRouter from './routes/bookings.js';
import databaseRouter from './routes/database.js';
import routesRouter from './routes/routes.js';
import telemetryRouter from './routes/telemetry.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all origins so web client and Flutter APK can connect
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Mount Routes
app.use('/api/homestays', homestaysRouter);
app.use('/api/owner', ownerRouter);
app.use('/api/admin', adminRouter);
app.use('/api/bookings', bookingsRouter);
app.use('/api/db', databaseRouter);
app.use('/api/routes', routesRouter);
app.use('/api/telemetry', telemetryRouter);
app.use('/api', uploadRouter);
app.use('/api/enclaves', enclavesRouter);
app.use('/uploads', express.static(path.join(path.dirname(fileURLToPath(import.meta.url)), 'uploads')));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    service: 'Coastal Trails Shared API',
    endpoints: [
      '/api/homestays',
      '/api/bookings',
      '/api/db/stats',
      '/api/db/tables',
      '/api/routes'
    ]
  });
});

// Startup & Auto-Init
async function start() {
  try {
    await initDatabase();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`=======================================================`);
      console.log(`🚀 Gokarna Connect Shared Server running on http://localhost:${PORT}`);
      console.log(`📱 Flutter APK Local IP Access: http://10.0.2.2:${PORT} or http://<host-ip>:${PORT}`);
      console.log(`🗄️  Database Studio API: http://localhost:${PORT}/api/db/stats`);
      console.log(`=======================================================`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
