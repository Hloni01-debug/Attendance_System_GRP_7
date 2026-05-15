const express = require('express');
const router = express.Router();
const shiftController = require('../controller/shiftcontroller');
const { authMiddleware } = require('../middleware/authMiddleware');
const { authorizeRoles } = require('../middleware/roleMiddleware');

router.post('/check-in', authMiddleware, shiftController.clockIn);
router.put('/check-out', authMiddleware, shiftController.clockOut);
router.post('/start-now', authMiddleware, shiftController.startSpontaneousShift);
router.get('/today', authMiddleware, shiftController.getMyShift);

router.get('/', authMiddleware, authorizeRoles(2), shiftController.getAllShifts);
router.patch('/:id/inspection', authMiddleware, authorizeRoles(2), shiftController.updateInspectionStatus);

module.exports = router;