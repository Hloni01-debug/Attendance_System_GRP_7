const db = require('../../db');

const shiftController = {
    // 1. Clock-In (Planned)
    clockIn: async (req, res) => {
        const { shift_id, odometerStart, tankStart } = req.body;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.id]);
            const sql = `UPDATE Delivery_Shift SET Clock_In = NOW(), Odometer_Start = ?, Tank_Start = ?, Shift_Status = 'Active' WHERE Shift_ID = ? AND Shift_Status = 'Planned';`;
            const [result] = await db.query(sql, [odometerStart, tankStart, shift_id]);
            if (result.affectedRows === 0) return res.status(404).json({ message: "No planned shift found." });
            res.json({ message: "Clock-in successful." });
        } catch (error) {
            res.status(500).json({ message: "Clock-in failed", error: error.message });
        }
    },

    // 2. Clock-Out
    clockOut: async (req, res) => {
        const { shift_id, odometerEnd, tankEnd, fuelConsumedCan } = req.body;
        const id = req.params.id || shift_id;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.id]);
            const updateSql = `UPDATE Delivery_Shift SET Odometer_End = ?, Tank_End = ?, Fuel_Consumed_CAN = ?, Clock_Out = NOW() WHERE Shift_ID = ? AND Shift_Status = 'Active';`;
            await db.query(updateSql, [odometerEnd, tankEnd, fuelConsumedCan, id]);
            const [analysis] = await db.query("SELECT missing_fuel, Missing_Fuel_Status FROM v_Fuel_Theft_Analysis WHERE Shift_ID = ?", [id]);
            res.json({ message: "Check-out successful.", fuelSummary: analysis[0] });
        } catch (error) {
            res.status(500).json({ message: "Clock-out failed", error: error.message });
        }
    },

    // 3. Spontaneous Shift (Restored)
    startSpontaneousShift: async (req, res) => {
        const { vehicleId, startWarehouseId, odometerStart, tankStart } = req.body;
        try {
            await db.query("SET @current_user_id = ?;", [req.user.id]);
            const sql = `INSERT INTO Delivery_Shift (Employee_ID, Vehicle_ID, Start_Warehouse_ID, End_Warehouse_ID, Shift_Date, Clock_In, Odometer_Start, Tank_Start, Shift_Status) VALUES (?, ?, ?, ?, CURRENT_DATE, NOW(), ?, ?, 'Active');`;
            const [result] = await db.query(sql, [req.user.id, vehicleId, startWarehouseId, startWarehouseId, odometerStart, tankStart]);
            res.status(201).json({ message: "Spontaneous shift started!", shiftId: result.insertId });
        } catch (error) {
            res.status(500).json({ message: "Failed to start emergency shift.", error: error.message });
        }
    },

    // 4. Get My Shift
    getMyShift: async (req, res) => {
        try {
            const sql = `SELECT s.*, v.Registration_Number FROM Delivery_Shift s JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID WHERE s.Employee_ID = ? AND s.Shift_Status IN ('Planned', 'Active') ORDER BY s.Shift_Date ASC LIMIT 1;`;
            const [rows] = await db.query(sql, [req.user.id]);
            res.json(rows[0] || null);
        } catch (error) {
            res.status(500).json({ message: "Error fetching shift." });
        }
    },

    // 5. Admin Inspection (The function the Route is looking for)
    updateInspectionStatus: async (req, res) => {
        const { id } = req.params;
        const { fuelStatus } = req.body; 
        try {
            await db.query("SET @current_user_id = ?;", [req.user.id]);
            await db.query(`UPDATE Delivery_Shift SET Missing_Fuel_Status = ? WHERE Shift_ID = ?`, [fuelStatus, id]);
            if (fuelStatus === 'Mechanical Fault') {
                await db.query(`UPDATE Vehicle v JOIN Delivery_Shift s ON v.Vehicle_ID = s.Vehicle_ID SET v.Status = 'Maintenance' WHERE s.Shift_ID = ?;`, [id]);
            }
            res.json({ message: `Inspection complete. Status set to ${fuelStatus}.` });
        } catch (error) {
            res.status(500).json({ message: "Inspection update failed.", error: error.message });
        }
    },

    // 6. Get All Shifts
    getAllShifts: async (req, res) => {
        try {
            const [rows] = await db.query(`SELECT s.*, CONCAT(e.First_Name, ' ', e.Last_Name) AS driver_name, v.Registration_Number AS vehicle_plate FROM Delivery_Shift s JOIN Employee e ON s.Employee_ID = e.Employee_ID JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID ORDER BY s.Shift_Date DESC;`);
            res.json(rows);
        } catch (error) {
            res.status(500).json({ message: "Error fetching shifts." });
        }
    }
};

module.exports = shiftController; // CRITICAL: Exporting the object