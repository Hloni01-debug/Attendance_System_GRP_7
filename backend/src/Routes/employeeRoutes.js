import express from "express";

import {
    fetchEmployees,
    fetchEmployeeById,
    addEmployee,
    removeEmployee
} from "../controllers/employeeController.js";

import { authMiddleware } from "../middlewares/authMiddleware.js";
import { authorizeRoles } from "../middlewares/roleMiddleware.js";

const router = express.Router();


router.get("/", authMiddleware, authorizeRoles("Fleet Admin"), fetchEmployees);

router.get("/:id", authMiddleware, authorizeRoles("Fleet Admin"), fetchEmployeeById);

router.post("/", authMiddleware, authorizeRoles("Fleet Admin"), addEmployee);

router.delete("/:id", authMiddleware, authorizeRoles("Fleet Admin"), removeEmployee);

export default router;