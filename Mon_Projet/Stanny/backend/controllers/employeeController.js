const employeeService = require('../services/employeeService');
const { sendSuccess } = require('../utils/http');

async function getEmployees(req, res) {
  const employees = await employeeService.listEmployees(req.user.id);
  return sendSuccess(res, employees);
}

async function createEmployee(req, res) {
  const employee = await employeeService.createEmployee(req.body, req.user.id);
  return sendSuccess(res, employee, 201);
}

async function deleteEmployee(req, res) {
  const employee = await employeeService.deleteEmployee(req.params.id);
  return sendSuccess(res, {
    message: 'Employé supprimé avec succès',
    employee
  });
}

async function updateEmployee(req, res) {
  const employee = await employeeService.updateEmployee(req.params.id, req.body);
  return sendSuccess(res, employee);
}

module.exports = { getEmployees, createEmployee, updateEmployee, deleteEmployee };