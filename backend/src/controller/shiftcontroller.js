const db = require('../config/db');

const shiftController = {
    // 1. Clock-In (Planned)
    clockIn: async (req, res, next) => {
        const { shift_id, odometerStart, tankStart } = req.body;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.employeeId]);
            const sql = `UPDATE Delivery_Shift SET Clock_In = NOW(), Odometer_Start = ?, Tank_Start = ?, Shift_Status = 'Active' WHERE Shift_ID = ? AND Shift_Status = 'Planned';`;
            const [result] = await db.query(sql, [odometerStart, tankStart, shift_id]);
            
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "No planned shift found." });
            
            res.json({ success: true, message: "Clock-in successful." });
        } catch (err) { next(err); }
    },

    // 2. Clock-Out
    clockOut: async (req, res, next) => {
        const { shift_id, odometerEnd, tankEnd, fuelConsumedCan } = req.body;
        const id = req.params.id || shift_id;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.employeeId]);
            const updateSql = `UPDATE Delivery_Shift SET Odometer_End = ?, Tank_End = ?, Fuel_Consumed_CAN = ?, Clock_Out = NOW() WHERE Shift_ID = ? AND Shift_Status = 'Active';`;
            await db.query(updateSql, [odometerEnd, tankEnd, fuelConsumedCan, id]);
            
            const [analysis] = await db.query("SELECT missing_fuel, Missing_Fuel_Status FROM v_Fuel_Theft_Analysis WHERE Shift_ID = ?", [id]);
            res.json({ success: true, message: "Check-out successful.", fuelSummary: analysis[0] });
        } catch (err) { next(err); }
    },

    // 3. Spontaneous/unplanned shift
    startSpontaneousShift: async (req, res, next) => {
        const { vehicleId, startWarehouseId, odometerStart, tankStart } = req.body;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.employeeId]);
            const sql = `INSERT INTO Delivery_Shift (Employee_ID, Vehicle_ID, Start_Warehouse_ID, End_Warehouse_ID, Shift_Date, Clock_In, Odometer_Start, Tank_Start, Shift_Status) VALUES (?, ?, ?, ?, CURRENT_DATE, NOW(), ?, ?, 'Active');`;
            const [result] = await db.query(sql, [req.user.employeeId, vehicleId, startWarehouseId, startWarehouseId, odometerStart, tankStart]);
            
            res.status(201).json({ success: true, message: "Spontaneous shift started!", shiftId: result.insertId });
        } catch (err) { next(err); }
    },

    // 4. Get My Shift
    getMyShift: async (req, res, next) => {
        try {
            const sql = `SELECT s.*, v.Registration_Number FROM Delivery_Shift s JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID WHERE s.Employee_ID = ? AND s.Shift_Status IN ('Planned', 'Active') ORDER BY s.Shift_Date ASC LIMIT 1;`;
            const [rows] = await db.query(sql, [req.user.employeeId]);
            res.json(rows[0] || null);
        } catch (err) { next(err); }
    },

    // 5. Admin Inspection
    updateInspectionStatus: async (req, res, next) => {
        const { id } = req.params;
        const { fuelStatus } = req.body; 
        try {
            await db.query("SET @current_user_id = ?;", [req.user.employeeId]);
            await db.query(`UPDATE Delivery_Shift SET Missing_Fuel_Status = ? WHERE Shift_ID = ?`, [fuelStatus, id]);
            
            if (fuelStatus === 'Mechanical Fault') {
                await db.query(`UPDATE Vehicle v JOIN Delivery_Shift s ON v.Vehicle_ID = s.Vehicle_ID SET v.Status = 'Maintenance' WHERE s.Shift_ID = ?;`, [id]);
            }
            res.json({ success: true, message: `Inspection complete. Status set to ${fuelStatus}.` });
        } catch (err) { next(err); }
    },

    // 6. Get All Shifts
    getAllShifts: async (req, res, next) => {
        try {
            const [rows] = await db.query(`SELECT s.*, CONCAT(e.First_Name, ' ', e.Last_Name) AS driver_name, v.Registration_Number AS vehicle_plate FROM Delivery_Shift s JOIN Employee e ON s.Employee_ID = e.Employee_ID JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID ORDER BY s.Shift_Date DESC;`);
            res.json(rows);
        } catch (err) { next(err); }
    }
};

module.exports = shiftController;