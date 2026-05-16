const db = require('../config/db');

const vehicleController = {
    // 1. Get All Vehicles (Feeds Vehicles.jsx tables & counters)
    getAllVehicles: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    Vehicle_ID AS vehicle_id,
                    Registration_Number AS plate_number,
                    Make AS make,
                    Model AS model,
                    2026 AS year,
                    Max_Payload AS capacity_kg,
                    LOWER(Status) AS status,
                    1 AS warehouse_id,
                    'Primary Hub Warehouse' AS warehouse_name
                FROM Vehicle;
            `;
            const [rows] = await db.query(sql);
            res.json(rows);
        } catch (err) { next(err); }
    },

    // 2. Create Vehicle (Feeds Add Vehicle modal form submit)
    createVehicle: async (req, res, next) => {
        const { plate_number, make, model, capacity_kg, status } = req.body;
        try {
            const sql = `
                INSERT INTO Vehicle (Registration_Number, Make, Model, Max_Payload, Status, Registration_Expiry, COF_Expiry) 
                VALUES (?, ?, ?, ?, ?, DATE_ADD(CURDATE(), INTERVAL 1 YEAR), DATE_ADD(CURDATE(), INTERVAL 6 MONTH));
            `;
            await db.query(sql, [plate_number, make, model, capacity_kg, status || 'Available']);
            res.status(201).json({ success: true, message: "Vehicle added successfully!" });
        } catch (err) { next(err); }
    },

    // 3. Update Vehicle (THIS FIXES LINE 34 CRASH)
    updateVehicle: async (req, res, next) => {
        const { id } = req.params;
        const { plate_number, make, model, capacity_kg, status } = req.body;
        try {
            const sql = `
                UPDATE Vehicle 
                SET Registration_Number = ?, Make = ?, Model = ?, Max_Payload = ?, Status = ? 
                WHERE Vehicle_ID = ?;
            `;
            await db.query(sql, [plate_number, make, model, capacity_kg, status, id]);
            res.json({ success: true, message: "Vehicle updated successfully!" });
        } catch (err) { next(err); }
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