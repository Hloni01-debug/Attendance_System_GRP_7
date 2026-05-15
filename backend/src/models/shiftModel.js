const pool = require('../config/db');

const shiftModel = {
    // Finds a shift scheduled for today that hasn't started yet
    findPlannedShift: async (employeeId) => {
        const [rows] = await pool.query(
            `SELECT * FROM Delivery_Shift 
             WHERE Employee_ID = ? 
             AND Shift_Date = CURDATE() 
             AND Shift_Status = 'Planned' 
             LIMIT 1`,
            [employeeId]
        );
        return rows[0];
    },

    // Starts the shift
    startShift: async (shiftId) => {
        const [result] = await pool.query(
            `UPDATE Delivery_Shift 
             SET Clock_In = CURRENT_TIMESTAMP, 
                 Shift_Status = 'Active' 
             WHERE Shift_ID = ?`,
            [shiftId]
        );
        return result;
    },

    // Ends the shift (Trigger trg_manage_shift_status will auto-set status to 'Completed')
    endShift: async (shiftId, employeeId) => {
        const [result] = await pool.query(
            `UPDATE Delivery_Shift 
             SET Clock_Out = CURRENT_TIMESTAMP 
             WHERE Shift_ID = ? AND Employee_ID = ?`,
            [shiftId, employeeId]
        );
        return result;
    },

    // Gets the active shift for the "GET /today" route
    getTodayShift: async (employeeId) => {
        const [rows] = await pool.query(
            `SELECT * FROM Delivery_Shift 
             WHERE Employee_ID = ? AND Shift_Date = CURDATE()`,
            [employeeId]
        );
        return rows[0];
    }
};

module.exports = shiftModel;