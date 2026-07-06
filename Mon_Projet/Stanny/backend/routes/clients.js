const express = require('express');
const clientController = require('../controllers/clientController');
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', asyncHandler(clientController.getClients));
router.post('/', asyncHandler(clientController.createClient));
router.put('/:id', asyncHandler(clientController.updateClient));
router.delete('/:id', asyncHandler(clientController.deleteClient));

module.exports = router;