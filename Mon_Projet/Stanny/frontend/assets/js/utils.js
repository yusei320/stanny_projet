/**
 * Fonctions utilitaires modernes pour TechService Manager
 */

// Formater une date
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR');
};

// Formater une date et heure
const formatDateTime = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR') + ' ' + date.toLocaleTimeString('fr-FR', { 
    hour: '2-digit', 
    minute: '2-digit' 
  });
};

// Formater un montant en devise
const formatCurrency = (amount) => {
  if (amount === undefined || amount === null) return '0 XAF';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'XAF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Formater une date courte
const formatDateShort = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  if (date.toDateString() === today.toDateString()) {
    return 'Aujourd\'hui';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Hier';
  } else {
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
};

// Debounce pour optimiser les recherches
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// Mettre à jour la date et l'heure
const updateDateTime = () => {
  const now = new Date();
  const dateElement = document.getElementById('currentDate');
  const timeElement = document.getElementById('currentTime');
  
  if (dateElement) {
    dateElement.textContent = now.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
  
  if (timeElement) {
    timeElement.textContent = now.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    });
  }
};

// Toggle sidebar
const toggleSidebar = () => {
  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('hidden');
  }
};

// Ouvrir un modal
const openModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }
};

// Fermer un modal
const closeModal = (modalId) => {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.classList.add('hidden');
    document.body.style.overflow = 'auto';
  }
};

// Afficher un message de succès
const showSuccess = (message) => {
  showNotification(message, 'success');
};

// Afficher un message d'erreur
const showError = (message) => {
  showNotification(message, 'error');
};

// Afficher une notification
const showNotification = (message, type = 'info') => {
  const notification = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500';
  
  notification.className = `fixed top-4 right-4 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in`;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('animate-slide-out');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
};

// Priorités des tâches
const PRIORITIES = {
  'basse': { color: 'bg-gray-100 text-gray-700', icon: 'fa-arrow-down' },
  'normale': { color: 'bg-blue-100 text-blue-700', icon: 'fa-minus' },
  'haute': { color: 'bg-orange-100 text-orange-700', icon: 'fa-arrow-up' },
  'urgente': { color: 'bg-red-100 text-red-700', icon: 'fa-exclamation' }
};

const getPriorityInfo = (priority) => {
  return PRIORITIES[priority?.toLowerCase()] || PRIORITIES['normale'];
};

// Couleurs des statuts
const STATUS_COLORS = {
  'en attente': 'bg-yellow-100 text-yellow-700',
  'en cours': 'bg-blue-100 text-blue-700',
  'terminée': 'bg-green-100 text-green-700',
  'terminé': 'bg-green-100 text-green-700',
  'à faire': 'bg-gray-100 text-gray-700',
  'payée': 'bg-green-100 text-green-700',
  'en retard': 'bg-red-100 text-red-700',
  'actif': 'bg-green-100 text-green-700',
  'inactif': 'bg-gray-100 text-gray-700',
  'dépôt': 'bg-blue-100 text-blue-700',
  'retrait': 'bg-orange-100 text-orange-700',
  'entrée': 'bg-green-100 text-green-700',
  'sortie': 'bg-red-100 text-red-700'
};

const getStatusClass = (status) => {
  return STATUS_COLORS[status?.toLowerCase()] || 'bg-gray-100 text-gray-700';
};

// Theme management
const initTheme = () => {
  const darkMode = localStorage.getItem('darkMode') === 'true';
  if (darkMode) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const toggleTheme = (isDark) => {
  localStorage.setItem('darkMode', isDark);
  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
};

const toggleDarkMode = () => {
  const isDark = !document.documentElement.classList.contains('dark');
  toggleTheme(isDark);
  return isDark;
};

// Get initials from name
const getInitials = (name) => {
  if (!name) return '?';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

// Get a consistent color for an avatar based on name
const getAvatarColor = (name) => {
  const colors = [
    'bg-blue-500', 'bg-red-500', 'bg-green-500', 'bg-yellow-500', 
    'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
  ];
  if (!name) return colors[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

// Initialisation de l'authentification
const checkAuth = async () => {
  const token = api.getToken();
  if (!token) {
    if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('register.html')) {
      window.location.href = '../auth/login.html';
    }
    return null;
  }
  return JSON.parse(localStorage.getItem('user'));
};

// Déconnexion
const logout = () => {
  if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
    api.clearToken();
    window.location.href = '../auth/login.html';
  }
};

// Exporter les fonctions
window.utils = {
  formatDate,
  formatDateTime,
  formatCurrency,
  formatDateShort,
  debounce,
  updateDateTime,
  toggleSidebar,
  openModal,
  closeModal,
  showSuccess,
  showError,
  showNotification,
  getStatusClass,
  getPriorityInfo,
  checkAuth,
  logout,
  getInitials,
  getAvatarColor,
  initTheme,
  toggleTheme,
  toggleDarkMode
};

// Initialize theme on load
initTheme();
