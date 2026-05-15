import { sendUnathorizedResponse } from "../utils/4xx/unauthorizedResponse.js";
import jwt from "jsonwebtoken";

export const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return sendUnathorizedResponse(req, res, "No authorization header provided");
        }

        const token = authHeader.split(" ")[1];

        if (!token) {
            return sendUnathorizedResponse(req, res, "Invalid token format");
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET_TOKEN);

        req.userInfo = decodedToken;

        next();

    } catch (error) {
        return sendUnathorizedResponse(req, res, "Token invalid or expired");
    }
};