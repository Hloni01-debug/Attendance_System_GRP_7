export const authorizeRoles = (...roles) => {
    return (req, res, next) => {
        if (!req.userInfo) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized. Please log in first."
            });
        }

        if (!roles.includes(req.userInfo.role)) {
            return res.status(403).json({
                success: false,
                message: "Access denied."
            });
        }

        next();
    };
};