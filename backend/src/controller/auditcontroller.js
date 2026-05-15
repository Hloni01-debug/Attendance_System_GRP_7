const db = require('../../db');

const auditController = {
    /**
     * @desc    Get all security and operational logs with detailed actor info
     * @route   GET /api/audit
     */
    getAllLogs: async (req, res) => {
        try {
            const sql = `
                SELECT 
                    a.Log_ID,
                    a.Action_Type,
                    a.Table_Affected,
                    a.Old_Value,
                    a.New_Value,
                    a.Action_Timestamp,
                    -- Returning raw ID for the frontend to use if needed
                    a.Employee_ID, 
                    -- Concatenating Name and ID for the "performed_by" display
                    CASE 
                        WHEN e.Employee_ID IS NOT NULL THEN 
                            CONCAT(e.First_Name, ' ', e.Last_Name, ' (ID: ', e.Employee_ID, ')')
                        ELSE 'System Action'
                    END AS performed_by
                FROM Audit_Log a
                LEFT JOIN Employee e ON a.Employee_ID = e.Employee_ID
                ORDER BY a.Action_Timestamp DESC;
            `;
            const [rows] = await db.query(sql);
            res.json(rows);
        } catch (error) {
            console.error("Database Error Detail:", error.message);
            res.status(500).json({ message: "Failed to retrieve audit logs.", error: error.message });
        }
    }
};

module.exports = auditController;