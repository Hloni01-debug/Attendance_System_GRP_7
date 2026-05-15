const express = require('express');
const router = express.Router();
const shiftController = require('../controller/shiftcontroller');

// Attendance Paths
router.post('/check-in', shiftController.clockIn);
router.put('/check-out', shiftController.clockOut);
router.post('/start-now', shiftController.startSpontaneousShift); // Spontaneous Shift
router.get('/today', shiftController.getMyShift);

// Management Paths
router.get('/', shiftController.getAllShifts);
router.patch('/:id/inspection', shiftController.updateInspectionStatus); // Line 13

module.exports = router;