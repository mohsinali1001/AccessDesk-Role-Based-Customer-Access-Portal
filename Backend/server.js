import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import customersRouter from './routes/customers.js';
import accessRouter from './routes/access.js';
import { DATABASE, TABLE, PROFILES } from './config/roles.js';

const app = express();
const PORT = process.env.PORT || 5000;

// CORS: only the frontend origins listed in .env may call this API from a browser.
// "x-api-key" is a custom header, so the browser sends a preflight OPTIONS request first.
const defaultOrigins = [
  'http://localhost:5500', 'http://127.0.0.1:5500',
  'http://localhost', 'http://127.0.0.1',
  'http://localhost:8080', 'http://127.0.0.1:8080'
];
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map((o) => o.trim()).filter(Boolean);
const origins = allowedOrigins.length ? allowedOrigins : defaultOrigins;

app.use(cors({
  origin: origins,
  methods: ['GET'],
  allowedHeaders: ['Content-Type', 'x-api-key']
}));
app.use(express.json());

// Server-running check (does not touch the database or spend credits).
app.get('/', (req, res) => {
  res.json({ service: 'AccessDesk API', status: 'running', database: DATABASE, table: TABLE });
});

app.use('/api/customers', customersRouter);
app.use('/api/access', accessRouter);

// Unknown route -> JSON, not an HTML error page.
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Last-resort error handler (Express 5 forwards rejected async handlers here).
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ message: 'Server error' });
});

app.listen(PORT, () => {
  console.log(`AccessDesk API ready: http://localhost:${PORT}`);
  console.log(`Database: ${DATABASE} | Table: ${TABLE}`);
  for (const p of Object.values(PROFILES)) {
    console.log(`  ${p.role.padEnd(8)} maxRows=${String(p.maxRows).padEnd(3)} credits=${p.totalCredits}`);
  }
});