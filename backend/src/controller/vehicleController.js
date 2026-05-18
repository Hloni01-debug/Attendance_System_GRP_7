const db = require('../config/db');

const vehicleController = {
    // 1. Get All Vehicles (Feeds Vehicles.jsx tables & counters)
    getAllVehicles: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    v.Vehicle_ID AS vehicle_id,
                    v.Registration_Number AS plate_number,
                    v.Registration_Expiry AS registration_expiry,
                    v.COF_Expiry AS cof_expiry,
                    v.Make AS make,
                    v.Model AS model,
                    2026 AS year,
                    v.Max_Payload AS capacity_kg,
                    LOWER(v.Status) AS status,
                    1 AS warehouse_id,
                    'Primary Hub Warehouse' AS warehouse_name,
                    vc.License_Status AS license_status,
                    vc.Roadworthy_Status AS roadworthy_status,
                    vc.Vehicle_Readiness AS vehicle_readiness
                FROM Vehicle v
                LEFT JOIN v_Vehicle_Compliance vc ON v.Vehicle_ID = vc.Vehicle_ID;
            `;
            const [rows] = await db.query(sql);
            res.json(rows);
        } catch (err) { next(err); }
    },

    // 2. Create Vehicle (Feeds Add Vehicle modal form submit)
    createVehicle: async (req, res, next) => {
        const { plate_number, make, model, capacity_kg, status, registration_expiry, cof_expiry } = req.body;
        try {
            const cleanPayload = capacity_kg && capacity_kg !== '' ? parseFloat(capacity_kg) : 0.00;
            const cleanRegExpiry = registration_expiry && registration_expiry !== '' ? registration_expiry : null;
            const cleanCofExpiry = cof_expiry && cof_expiry !== '' ? cof_expiry : null;

            const sql = `
                INSERT INTO Vehicle (Registration_Number, Make, Model, Max_Payload, Status, Registration_Expiry, COF_Expiry) 
                VALUES (?, ?, ?, ?, ?, IFNULL(?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR)), IFNULL(?, DATE_ADD(CURDATE(), INTERVAL 6 MONTH)));
            `;
            await db.query(sql, [plate_number, make, model, cleanPayload, status || 'Available', cleanRegExpiry, cleanCofExpiry]);
            res.status(201).json({ success: true, message: "Vehicle added successfully!" });
        } catch (err) { next(err); }
    },

    // update vehicle with connection pooling session for triggers
    updateVehicle: async (req, res, next) => {
        const { id } = req.params;
        const { plate_number, make, model, capacity_kg, status, registration_expiry, cof_expiry } = req.body;
        
        const connection = await db.getConnection();
        try {
            const adminActorId = req.user?.employeeId || req.user?.employee_id || 1;
            await connection.query("SET @current_user_id = ?;", [adminActorId]);

            const cleanPayload = capacity_kg && capacity_kg !== '' ? parseFloat(capacity_kg) : 0.00;
            const cleanRegExpiry = registration_expiry && registration_expiry !== '' ? registration_expiry : null;
            const cleanCofExpiry = cof_expiry && cof_expiry !== '' ? cof_expiry : null;

            const sql = `
                UPDATE Vehicle 
                SET Registration_Number = ?, Make = ?, Model = ?, Max_Payload = ?, Status = ?, Registration_Expiry = ?, COF_Expiry = ? 
                WHERE Vehicle_ID = ?;
            `;
            await connection.query(sql, [plate_number, make, model, cleanPayload, status, cleanRegExpiry, cleanCofExpiry, id]);
            res.json({ success: true, message: "Vehicle updated successfully!" });
        } catch (err) { 
            next(err); 
        } finally {
            connection.release();
        }
    },

    // 4. Delete Vehicle
    deleteVehicle: async (req, res, next) => {
        const { id } = req.params;
        try {
            await db.query("DELETE FROM Vehicle WHERE Vehicle_ID = ?", [id]);
            res.json({ success: true, message: "Vehicle removed successfully!" });
        } catch (err) { next(err); }
    }
};

module.exports = vehicleController;