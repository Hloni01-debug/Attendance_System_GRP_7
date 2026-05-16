const db = require('../config/db');

const parcelController = {
    // 1. Get All Parcels (Feeds Parcels.jsx grid view cards)
    getAllParcels: async (req, res, next) => {
        try {
            const sql = `
                SELECT 
                    p.Parcel_ID AS parcel_id,
                    CONCAT('LX-', p.Parcel_ID) AS tracking_code,
                    p.Origin_Address AS sender_name,
                    p.Receiver_Name AS recipient_name,
                    p.Destination_Address AS recipient_addr,
                    p.Parcel_Weight AS weight_kg,
                    LOWER(ps.Status_Name) AS status,
                    p.Shift_ID AS shift_id,
                    NULL AS delivered_at
                FROM Parcel p
                JOIN Parcel_Status ps ON p.Status_ID = ps.Status_ID;
            `;
            const [rows] = await db.query(sql);
            res.json(rows);
        } catch (err) { next(err); }
    },

    // 2. Create Parcel 
    createParcel: async (req, res, next) => {
        const { sender_name, recipient_name, recipient_addr, weight_kg, shift_id } = req.body;
        try {
            const sql = `
                INSERT INTO Parcel (Shift_ID, Warehouse_ID, Parcel_Weight, Origin_Address, Destination_Address, Receiver_Name, Status_ID) 
                VALUES (?, 1, ?, ?, ?, ?, 1);
            `;
            await db.query(sql, [
                shift_id || null, 
                weight_kg || 0.00, 
                sender_name || 'Main Hub HQ', 
                recipient_addr, 
                recipient_name
            ]);
            res.status(201).json({ success: true, message: "Parcel created successfully!" });
        } catch (err) { next(err); }
    },

    // 3. Search Parcels
    searchParcels: async (req, res, next) => {
        const { q } = req.query;
        try {
            const sql = `
                SELECT 
                    p.Parcel_ID AS parcel_id,
                    CONCAT('LX-', p.Parcel_ID) AS tracking_code,
                    p.Receiver_Name AS recipient_name
                FROM Parcel p
                WHERE p.Receiver_Name LIKE ? OR CAST(p.Parcel_ID AS CHAR) LIKE ?;
            `;
            const [rows] = await db.query(sql, [`%${q}%`, `%${q}%`]);
            res.json(rows);
        } catch (err) { next(err); }
    }
};

module.exports = parcelController;