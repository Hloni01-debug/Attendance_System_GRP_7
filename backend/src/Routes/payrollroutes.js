const express = require('express');
const router = express.Router();
const payrollController = require('../controller/payrollcontroller'); 

// GET /api/payroll
router.get('/', payrollController.getAllPayroll);

// GET /api/payroll/:id
router.get('/:id', payrollController.getPayrollById);

// PUT /api/payroll/:id/approve
router.put('/:id/approve', payrollController.approvePayroll);

// PUT /api/payroll/:id/pay
router.put('/:id/pay', payrollController.processPayment);

module.exports = router;