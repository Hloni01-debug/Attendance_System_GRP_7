const pool = require('../config/db');

const vehicleModel = {
    getAllVehicles: async () => {
        const [rows] = await pool.query(`SELECT * FROM Vehicle`);
        return rows;
    },

    getVehicleById: async (id) => {
        const [rows] = await pool.query(`SELECT * FROM Vehicle WHERE Vehicle_ID = ?`, [id]);
        return rows[0];
    },

    createVehicle: async (data) => {
        const { registrationNumber, registrationExpiry, cofExpiry, maxPayload, make, model, status } = data;
        const [result] = await pool.query(
            `INSERT INTO Vehicle (Registration_Number, Registration_Expiry, COF_Expiry, Max_Payload, Make, Model, Status)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [registrationNumber, registrationExpiry, cofExpiry, maxPayload, make, model, status || "Available"]
        );
        return { id: result.insertId, ...data };
    },

    updateVehicleStatus: async (id, status) => {
        await pool.query(`UPDATE Vehicle SET Status = ? WHERE Vehicle_ID = ?`, [status, id]);
        return { id, status };
    },

    deleteVehicleById: async (id) => {
        const [result] = await pool.query(`DELETE FROM Vehicle WHERE Vehicle_ID = ?`, [id]);
        return result.affectedRows > 0;
    }
};

module.exports = vehicleModel;