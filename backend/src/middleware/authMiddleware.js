const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader) return res.status(401).json({ message: "No authorization header provided" });

        const token = authHeader.split(" ")[1];
        if (!token) return res.status(401).json({ message: "Invalid token format" });

        const decoded = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

        req.user = {
            id: decoded.employeeId,
            role_id: decoded.roleId,
            warehouse_id: decoded.warehouseId
        };

        next();
    } catch (error) {
        return res.status(401).json({ message: "Token invalid or expired" });
    }
};

module.exports = { authMiddleware };