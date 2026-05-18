const db = require('../config/db');

const shiftController = {
    createShift: async (req, res, next) => {
        const { employee_id, vehicle_id, warehouse_id, start_time, route_notes, status, odometer_start, tank_start } = req.body;
        try {
            const actorId = req.user?.employeeId || req.user?.employee_id || 1;
            await db.query("SET @current_user_id = ?;", [actorId]);

            const finalStatus = status === 'active' ? 'Active' : 'Planned';
            const cleanOdometerStart = odometer_start !== undefined && odometer_start !== '' ? parseFloat(odometer_start) : 0.00;
            const cleanTankStart = tank_start !== undefined && tank_start !== '' ? parseFloat(tank_start) : 0.00;

            const sql = `
                INSERT INTO Delivery_Shift 
                (Employee_ID, Vehicle_ID, Start_Warehouse_ID, End_Warehouse_ID, Shift_Date, Clock_In, Odometer_Start, Odometer_End, Tank_Start, Tank_End, Fuel_Consumed_CAN, Shift_Status) 
                VALUES (?, ?, ?, ?, DATE(?), ${status === 'active' ? 'NOW()' : 'NULL'}, ?, 0.00, ?, 0.00, 0.00, ?);
            `;
            
            await db.query(sql, [
                employee_id,
                vehicle_id,
                warehouse_id,
                warehouse_id,
                start_time,
                cleanOdometerStart,
                cleanTankStart,
                finalStatus
            ]);

            res.status(201).json({ success: true, message: "Shift created successfully!" });
        } catch (err) { next(err); }
    },

    clockIn: async (req, res, next) => {
        const { shift_id, odometerStart, tankStart } = req.body;
        try {
            const actorId = req.user?.employeeId || req.user?.employee_id || 1;
            await db.query("SET @current_user_id = ?;", [actorId]);
            
            const sql = `UPDATE Delivery_Shift SET Clock_In = NOW(), Odometer_Start = ?, Tank_Start = ?, Shift_Status = 'Active' WHERE Shift_ID = ? AND Shift_Status = 'Planned';`;
            const [result] = await db.query(sql, [odometerStart, tankStart, shift_id]);
            if (result.affectedRows === 0) return res.status(404).json({ success: false, message: "No planned shift found." });
            res.json({ success: true, message: "Clock-in successful." });
        } catch (err) { next(err); }
    },

    clockOut: async (req, res, next) => {
        const { shift_id, odometerEnd, tankEnd, fuelConsumedCan } = req.body;
        const id = req.params.id || shift_id;
        try {
            const actorId = req.user?.employeeId || req.user?.employee_id || 1;
            await db.query("SET @current_user_id = ?;", [actorId]);
            
            const updateSql = `UPDATE Delivery_Shift SET Odometer_End = ?, Tank_End = ?, Fuel_Consumed_CAN = ?, Clock_Out = NOW() WHERE Shift_ID = ? AND Shift_Status = 'Active';`;
            await db.query(updateSql, [odometerEnd, tankEnd, fuelConsumedCan, id]);
            const [analysis] = await db.query("SELECT missing_fuel, Missing_Fuel_Status FROM v_Fuel_Theft_Analysis WHERE Shift_ID = ?", [id]);
            res.json({ success: true, message: "Check-out successful.", fuelSummary: analysis[0] });
        } catch (err) { next(err); }
    },

    startSpontaneousShift: async (req, res, next) => {
        const { vehicleId, startWarehouseId, odometerStart, tankStart } = req.body;
        try {
            const actorId = req.user?.employeeId || req.user?.employee_id || 1;
            await db.query("SET @current_user_id = ?;", [actorId]);
            
            const sql = `INSERT INTO Delivery_Shift (Employee_ID, Vehicle_ID, Start_Warehouse_ID, End_Warehouse_ID, Shift_Date, Clock_In, Odometer_Start, Tank_Start, Shift_Status) VALUES (?, ?, ?, ?, CURRENT_DATE, NOW(), ?, ?, 'Active');`;
            const [result] = await db.query(sql, [req.user.employeeId, vehicleId, startWarehouseId, startWarehouseId, odometerStart, tankStart]);
            res.status(201).json({ success: true, message: "Spontaneous shift started!", shiftId: result.insertId });
        } catch (err) { next(err); }
    },

    getMyShift: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    s.Shift_ID AS shift_id,
                    s.Shift_ID AS attendance_id,
                    s.Shift_Date AS shift_date,
                    s.Clock_In AS check_in,
                    s.Clock_Out AS check_out,
                    LOWER(s.Shift_Status) AS status,
                    CASE 
                        WHEN s.Shift_Status = 'Completed' THEN ROUND(TIMESTAMPDIFF(MINUTE, s.Clock_In, s.Clock_Out) / 60, 1)
                        WHEN s.Shift_Status = 'Active' THEN ROUND(TIMESTAMPDIFF(MINUTE, s.Clock_In, NOW()) / 60, 1)
                        ELSE 0.0
                    END AS hours_worked,
                    v.Registration_Number AS vehicle_plate
                FROM Delivery_Shift s 
                JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID 
                WHERE s.Employee_ID = ? AND s.Shift_Status IN ('Planned', 'Active') 
                ORDER BY s.Shift_Date ASC LIMIT 1;
            `;
            const [rows] = await db.query(sql, [req.user.employeeId]);
            res.json(rows[0] || null);
        } catch (err) { next(err); }
    },

    updateInspectionStatus: async (req, res, next) => {
        const { id } = req.params;
        const { fuelStatus } = req.body; 
        try {
            const actorId = req.user?.employeeId || req.user?.employee_id || 1;
            await db.query("SET @current_user_id = ?;", [actorId]);
            
            await db.query(`UPDATE Delivery_Shift SET Missing_Fuel_Status = ? WHERE Shift_ID = ?`, [fuelStatus, id]);
            if (fuelStatus === 'Mechanical Fault') {
                await db.query(`UPDATE Vehicle v JOIN Delivery_Shift s ON v.Vehicle_ID = s.Vehicle_ID SET v.Status = 'Maintenance' WHERE s.Shift_ID = ?;`, [id]);
            }
            res.json({ success: true, message: `Inspection complete. Status set to ${fuelStatus}.` });
        } catch (err) { next(err); }
    },

    getAllShifts: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    s.Shift_ID AS shift_id,
                    s.Shift_ID AS attendance_id,
                    s.Shift_Date AS shift_date,
                    CONCAT(e.First_Name, ' ', e.Last_Name) AS driver_name,
                    CONCAT(e.First_Name, ' ', e.Last_Name) AS employee_name,
                    v.Registration_Number AS vehicle_plate,
                    s.Clock_In AS start_time,
                    s.Clock_In AS check_in,
                    s.Clock_Out AS end_time,
                    s.Clock_Out AS check_out,
                    LOWER(s.Shift_Status) AS status,
                    CASE 
                        WHEN s.Shift_Status = 'Completed' THEN ROUND(TIMESTAMPDIFF(MINUTE, s.Clock_In, s.Clock_Out) / 60, 1)
                        WHEN s.Shift_Status = 'Active' THEN ROUND(TIMESTAMPDIFF(MINUTE, s.Clock_In, NOW()) / 60, 1)
                        ELSE 0.0
                    END AS hours_worked,
                    w.Name AS warehouse_name,
                    (SELECT COUNT(*) FROM Parcel p WHERE p.Shift_ID = s.Shift_ID) AS parcel_count
                FROM Delivery_Shift s 
                JOIN Employee e ON s.Employee_ID = e.Employee_ID 
                JOIN Vehicle v ON s.Vehicle_ID = v.Vehicle_ID 
                JOIN Warehouse w ON s.Start_Warehouse_ID = w.Warehouse_ID
                ORDER BY s.Shift_Date DESC;
            `;
            const [rows] = await db.query(sql);
            res.json(rows);
        } catch (err) { next(err); }
    },
    
    updateStatus: async (req, res, next) => {
        const { id } = req.params;
        const { status, odometer_end, tank_end, fuel_consumed_can } = req.body;
        
        const connection = await db.getConnection();
        try {
            const adminActorId = req.user?.employeeId || req.user?.employee_id || 1;
            await connection.query("SET @current_user_id = ?;", [adminActorId]);

            if (status === 'active') {
                const sql = `
                    UPDATE Delivery_Shift 
                    SET Clock_In = NOW(), 
                        Shift_Status = 'Active' 
                    WHERE Shift_ID = ?;
                `;
                await connection.query(sql, [id]);
            } else if (status === 'completed') {
                const cleanOdometer = odometer_end && odometer_end !== '' ? parseFloat(odometer_end) : 0.00;
                const cleanTank = tank_end && tank_end !== '' ? parseFloat(tank_end) : 0.00;
                const cleanCanBus = fuel_consumed_can && fuel_consumed_can !== '' ? parseFloat(fuel_consumed_can) : 0.00;

                const sql = `
                    UPDATE Delivery_Shift 
                    SET Clock_Out = NOW(),
                        Odometer_End = ?,
                        Tank_End = ?,
                        Fuel_Consumed_CAN = ?
                    WHERE Shift_ID = ?;
                `;
                await connection.query(sql, [cleanOdometer, cleanTank, cleanCanBus, id]);
            } else {
                await connection.query("UPDATE Delivery_Shift SET Shift_Status = ? WHERE Shift_ID = ?;", [status, id]);
            }
            res.json({ success: true, message: `Shift status successfully updated to ${status}.` });
        } catch (err) { 
            next(err); 
        } finally {
            connection.release();
        }
    }
};

module.exports = shiftController;