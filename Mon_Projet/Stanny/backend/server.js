const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const taskRoutes = require('./routes/tasks');
const clientRoutes = require('./routes/clients');
const cashRoutes = require('./routes/cash');
const historyRoutes = require('./routes/history');
const profileRoutes = require('./routes/profile');
const settingsRoutes = require('./routes/settings');
const employeeRoutes = require('./routes/employees');
const documentRoutes = require('./routes/documents');

const db = require('./database/db');

const app = express();

const PORT = process.env.PORT || 3000;

// Rate limiter pour la connexion : max 10 tentatives par 15 minutes
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: {
    success: false,
    message: "Trop de tentatives de connexion. Veuillez réessayer après 15 minutes."
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net"],
      scriptSrcAttr: ["'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://ui-avatars.com"],
      connectSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      upgradeInsecureRequests: null,
    },
  },
  crossOriginEmbedderPolicy: false,
}));
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir les fichiers statiques AVANT les routes API pour éviter les conflits
app.use(express.static(path.join(__dirname, '../frontend')));

// Route favicon.ico — coupe le chargement infini du navigateur
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Routes API
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
app.use('/api/invoices', require('./routes/invoices'));

// Route racine : redirection immédiate vers le login
// On la place AVANT le middleware static pour éviter le conflit avec un éventuel index.html
app.get('/', (req, res) => {
  res.redirect('/login');
});

// Routes Frontend originales
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/auth/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/auth/register.html'));
});

app.get('/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/dashboard.html'));
});

app.get('/clients', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/clients.html'));
});

app.get('/projets', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/projets.html'));
});

app.get('/tasks', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/tasks.html'));
});

app.get('/employes', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/employes.html'));
});

app.get('/caisse', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/caisse.html'));
});

app.get('/devis', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/devis.html'));
});

app.get('/factures', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/factures.html'));
});

app.get('/fiche-fin-travaux', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/fiche-fin-travaux.html'));
});

app.get('/historique', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/historique.html'));
});

app.get('/profile', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/profile.html'));
});

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Une erreur est survenue sur le serveur',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Initialisation de la base de données
db.init()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Serveur en cours d'exécution sur le port ${PORT}`);
      console.log(`🌍 Lien d'accès : http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Impossible de démarrer le serveur:', err);
  });

// Protection contre les crashs inattendus
process.on('uncaughtException', (err) => {
  console.error('💥 UNCAUGHT EXCEPTION:', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 UNHANDLED REJECTION:', reason);
});