const db = require('../config/db');

const createFuelTransaction = async (req, res) => {
    const { Shift_ID, Fuel_Litres, Fuel_Cost } = req.body;
    try {
        const [result] = await db.query(
            'INSERT INTO Fuel_Transaction (Shift_ID, Fuel_Litres, Fuel_Cost) VALUES (?, ?, ?)',
            [Shift_ID, Fuel_Litres, Fuel_Cost]
        );
        res.status(201).json({ success: true, transactionId: result.insertId });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};

module.exports = { createFuelTransaction };