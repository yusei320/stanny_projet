const express = require('express');
const authController = require('../controllers/authController');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();

router.post('/register', asyncHandler(authController.register));
router.post('/login', asyncHandler(authController.login));

// Nouvelle route ajoutée pour la suppression de compte
router.delete('/delete-account/:id', asyncHandler(authController.deleteAccount));

module.exports = router;
