const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Import routes from backend
const authRoutes = require('../backend/routes/auth');
const projectRoutes = require('../backend/routes/projects');
const taskRoutes = require('../backend/routes/tasks');
const clientRoutes = require('../backend/routes/clients');
const cashRoutes = require('../backend/routes/cash');
const historyRoutes = require('../backend/routes/history');
const profileRoutes = require('../backend/routes/profile');
const settingsRoutes = require('../backend/routes/settings');
const employeeRoutes = require('../backend/routes/employees');
const documentRoutes = require('../backend/routes/documents');
const invoiceRoutes = require('../backend/routes/invoices');

const app = express();

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Veuillez réessayer après 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// API Routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/cash', cashRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/invoices', invoiceRoutes);

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Une erreur est survenue sur le serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Export for Vercel
module.exports = app;
