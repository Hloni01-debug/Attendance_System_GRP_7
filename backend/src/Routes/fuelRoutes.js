const express = require('express');
const router = express.Router();
const { createFuelTransaction } = require('../controllers/fuelController');

router.post('/', createFuelTransaction);

module.exports = router;