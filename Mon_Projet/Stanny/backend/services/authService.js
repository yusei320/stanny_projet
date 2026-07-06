const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { findUserByEmail, createUser } = require('../repositories/userRepository');
const { createHttpError } = require('../utils/http');
const { isNonEmptyString, isValidEmail } = require('../utils/validators');

function getJwtSecret() {
  return process.env.JWT_SECRET || 'stanny_secret_key';
}

function buildToken(user) {
  return jwt.sign(
    {
      user: {
        id: user.id
      }
    },
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

function sanitizeUser(user) {
  const sanitizedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    profile_image: user.profile_image,
    dark_mode: user.dark_mode !== false, // Défaut à true (sombre)
    language: user.language || 'fr',
    two_factor_enabled: !!user.two_factor_enabled
  };

  if (typeof user.role !== 'undefined') {
    sanitizedUser.role = user.role;
  }

  return sanitizedUser;
}

async function registerUser(payload) {
  const name = typeof payload.name === 'string' ? payload.name.trim() : '';
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!isNonEmptyString(name) || !isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw createHttpError(400, 'Tous les champs sont requis');
  }

  if (!isValidEmail(email)) {
    throw createHttpError(400, 'Adresse email invalide');
  }

  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw createHttpError(400, 'Cet email est déjà utilisé');
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await createUser({
    name,
    email,
    password: hashedPassword
  });

  return {
    message: 'Inscription réussie',
    token: buildToken(user),
    user: sanitizeUser(user)
  };
}

async function loginUser(payload) {
  const email = typeof payload.email === 'string' ? payload.email.trim().toLowerCase() : '';
  const password = typeof payload.password === 'string' ? payload.password : '';

  if (!isNonEmptyString(email) || !isNonEmptyString(password)) {
    throw createHttpError(400, 'Email et mot de passe requis');
  }

  if (!isValidEmail(email)) {
    throw createHttpError(400, 'Adresse email invalide');
  }

  const user = await findUserByEmail(email);

  if (!user) {
    throw createHttpError(401, 'Identifiants invalides');
  }

  const isPasswordValid = await bcrypt.compare(password, user.password);

  if (!isPasswordValid) {
    throw createHttpError(401, 'Identifiants invalides');
  }

  return {
    message: 'Connexion réussie',
    token: buildToken(user),
    user: sanitizeUser(user)
  };
}

module.exports = { registerUser, loginUser };