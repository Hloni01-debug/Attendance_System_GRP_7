import express from "express"
import {
    fetchVehicles,
    fetchVehicleById,
    addVehicle,
    changeVehicleStatus,
    removeVehicle
} from "../controllers/vehicleController.js"

import { authMiddleware } from "../middlewares/authMiddleware.js"
import { authorizeRoles } from "../middlewares/roleMiddleware.js"

const router = express.Router()


router.get("/", authMiddleware, authorizeRoles(("Fleet Admin")), fetchVehicles)

router.get("/:id", authMiddleware, authorizeRoles("Fleet Admin"), fetchVehicleById)


router.post("/", authMiddleware, authorizeRoles("Fleet Admin"), addVehicle)

router.put("/status/:id", authMiddleware, authorizeRoles("Fleet Admin"), changeVehicleStatus)


router.delete("/:id", authMiddleware, authorizeRoles("Fleet Admin"), removeVehicle)

export default router