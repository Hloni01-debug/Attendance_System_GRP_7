const express = require("express");
const router = express.Router();
const vehicleController = require("../controller/vehicleController");
const { authMiddleware } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
router.get("/", authMiddleware, authorizeRoles(2), vehicleController.fetchVehicles);
router.get("/:id", authMiddleware, authorizeRoles(2), vehicleController.fetchVehicleById);
router.post("/", authMiddleware, authorizeRoles(2), vehicleController.addVehicle);
router.put("/status/:id", authMiddleware, authorizeRoles(2), vehicleController.changeVehicleStatus);
router.delete("/:id", authMiddleware, authorizeRoles(2), vehicleController.removeVehicle);

module.exports = router;