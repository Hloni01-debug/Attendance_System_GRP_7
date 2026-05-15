const express = require('express');
const router = express.Router();
const auditController = require('../controller/auditcontroller');

// GET /api/audit
// This matches the only function we have in the controller right now
router.get('/', auditController.getAllLogs);

module.exports = router;