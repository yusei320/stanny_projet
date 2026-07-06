const express = require('express');
const employeeController = require('../controllers/employeeController');
const asyncHandler = require('../utils/asyncHandler');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware);

router.get('/', asyncHandler(employeeController.getEmployees));
router.post('/', asyncHandler(employeeController.createEmployee));
router.put('/:id', asyncHandler(employeeController.updateEmployee));
router.delete('/:id', asyncHandler(employeeController.deleteEmployee));

module.exports = router;