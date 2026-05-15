const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized. Please log in first." });
        }

        if (!allowedRoles.includes(req.user.role_id)) {
            return res.status(403).json({ message: "Access denied." });
        }

        next();
    };
};

module.exports = { authorizeRoles };