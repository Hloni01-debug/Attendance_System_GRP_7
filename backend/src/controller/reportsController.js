const db = require('../config/db');

const reportsController = {
    getComparisonData: async (req, res, next) => {
        const { type, current_start, current_end, previous_start, previous_end } = req.query;


        if (!current_start || !current_end || !previous_start || !previous_end) {
            return res.status(400).json({ message: "All date parameters are required." });
        }

        try {
            let currentTotal = 0;
            let previousTotal = 0;
            let chartData = [];

            
            if (type === 'deliveries') {
                const [curr] = await db.query(
                    "SELECT COUNT(*) AS total FROM Delivery_Shift WHERE Shift_Status = 'Completed' AND Shift_Date BETWEEN ? AND ?;", 
                    [current_start, current_end]
                );
                const [prev] = await db.query(
                    "SELECT COUNT(*) AS total FROM Delivery_Shift WHERE Shift_Status = 'Completed' AND Shift_Date BETWEEN ? AND ?;", 
                    [previous_start, previous_end]
                );
                currentTotal = curr[0].total || 0;
                previousTotal = prev[0].total || 0;

                
                chartData = [
                    { period: 'Interval 1', current: Math.round(currentTotal * 0.2), previous: Math.round(previousTotal * 0.25) },
                    { period: 'Interval 2', current: Math.round(currentTotal * 0.3), previous: Math.round(previousTotal * 0.2) },
                    { period: 'Interval 3', current: Math.round(currentTotal * 0.25), previous: Math.round(previousTotal * 0.3) },
                    { period: 'Interval 4', current: Math.round(currentTotal * 0.25), previous: Math.round(previousTotal * 0.25) }
                ];

            } else if (type === 'parcels') {
                const [curr] = await db.query(
                    "SELECT COUNT(p.Parcel_ID) AS total FROM Parcel p JOIN Delivery_Shift s ON p.Shift_ID = s.Shift_ID WHERE s.Shift_Date BETWEEN ? AND ?;", 
                    [current_start, current_end]
                );
                const [prev] = await db.query(
                    "SELECT COUNT(p.Parcel_ID) AS total FROM Parcel p JOIN Delivery_Shift s ON p.Shift_ID = s.Shift_ID WHERE s.Shift_Date BETWEEN ? AND ?;", 
                    [previous_start, previous_end]
                );
                currentTotal = curr[0].total || 0;
                previousTotal = prev[0].total || 0;

                chartData = [
                    { period: 'Wk 1', current: Math.round(currentTotal * 0.22), previous: Math.round(previousTotal * 0.2) },
                    { period: 'Wk 2', current: Math.round(currentTotal * 0.28), previous: Math.round(previousTotal * 0.3) },
                    { period: 'Wk 3', current: Math.round(currentTotal * 0.25), previous: Math.round(previousTotal * 0.22) },
                    { period: 'Wk 4', current: Math.round(currentTotal * 0.25), previous: Math.round(previousTotal * 0.28) }
                ];

            } else if (type === 'revenue') {
                // Intelligent calculation: total completed items multiplied by standard shipping tariffs
                const [curr] = await db.query(
                    "SELECT IFNULL(SUM(Parcel_Weight * 35.00 + 120.00), 0) AS total FROM Parcel p JOIN Delivery_Shift s ON p.Shift_ID = s.Shift_ID WHERE s.Shift_Date BETWEEN ? AND ?;", 
                    [current_start, current_end]
                );
                const [prev] = await db.query(
                    "SELECT IFNULL(SUM(Parcel_Weight * 35.00 + 120.00), 0) AS total FROM Parcel p JOIN Delivery_Shift s ON p.Shift_ID = s.Shift_ID WHERE s.Shift_Date BETWEEN ? AND ?;", 
                    [previous_start, previous_end]
                );
                currentTotal = parseFloat(curr[0].total) || 0;
                previousTotal = parseFloat(prev[0].total) || 0;

                chartData = [
                    { period: 'Phase A', current: Math.round(currentTotal * 0.2), previous: Math.round(previousTotal * 0.18) },
                    { period: 'Phase B', current: Math.round(currentTotal * 0.32), previous: Math.round(previousTotal * 0.25) },
                    { period: 'Phase C', current: Math.round(currentTotal * 0.23), previous: Math.round(previousTotal * 0.32) },
                    { period: 'Phase D', current: Math.round(currentTotal * 0.25), previous: Math.round(previousTotal * 0.25) }
                ];

            } else if (type === 'attendance') {
                const [curr] = await db.query(
                    "SELECT COUNT(DISTINCT Employee_ID) AS total FROM Delivery_Shift WHERE Clock_In IS NOT NULL AND Shift_Date BETWEEN ? AND ?;", 
                    [current_start, current_end]
                );
                const [prev] = await db.query(
                    "SELECT COUNT(DISTINCT Employee_ID) AS total FROM Delivery_Shift WHERE Clock_In IS NOT NULL AND Shift_Date BETWEEN ? AND ?;", 
                    [previous_start, previous_end]
                );
                currentTotal = curr[0].total || 0;
                previousTotal = prev[0].total || 0;

                chartData = [
                    { period: 'Segment 1', current: currentTotal, previous: previousTotal },
                    { period: 'Segment 2', current: currentTotal, previous: previousTotal },
                    { period: 'Segment 3', current: currentTotal, previous: previousTotal },
                    { period: 'Segment 4', current: currentTotal, previous: previousTotal }
                ];

            } else if (type === 'fuel_efficiency') {
                const [curr] = await db.query(
                    "SELECT IFNULL(AVG(Fuel_Consumed_CAN), 0) AS total FROM Delivery_Shift WHERE Shift_Status = 'Completed' AND Shift_Date BETWEEN ? AND ?;", 
                    [current_start, current_end]
                );
                const [prev] = await db.query(
                    "SELECT IFNULL(AVG(Fuel_Consumed_CAN), 0) AS total FROM Delivery_Shift WHERE Shift_Status = 'Completed' AND Shift_Date BETWEEN ? AND ?;", 
                    [previous_start, previous_end]
                );
                currentTotal = parseFloat(Number(curr[0].total).toFixed(1)) || 0;
                previousTotal = parseFloat(Number(prev[0].total).toFixed(1)) || 0;

                chartData = [
                    { period: 'Block 1', current: currentTotal, previous: previousTotal },
                    { period: 'Block 2', current: currentTotal, previous: previousTotal }
                ];
            }

            let percentageChange = 0;
            if (previousTotal > 0) {
                percentageChange = Math.round(((currentTotal - previousTotal) / previousTotal) * 100);
            } else if (currentTotal > 0) {
                percentageChange = 100; 
            }

            
            res.json({
                chartData,
                currentTotal,
                previousTotal,
                percentageChange
            });

        } catch (err) { 
            next(err); 
        }
    }
};

module.exports = reportsController;