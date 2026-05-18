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
                    a.Action_Timestamp,
                    a.Old_Value,
                    a.New_Value,
                    a.Employee_ID AS Actor_ID, 
                    CASE 
                        WHEN a.Old_Value LIKE 'TargetEmpID:%' THEN 
                            SUBSTRING_INDEX(SUBSTRING_INDEX(a.Old_Value, ' | ', 1), 'TargetEmpID: ', -1)
                        ELSE NULL
                    END AS Affected_Employee_ID,
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