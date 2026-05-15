const vehicleModel = require("../models/vehicleModel");

const vehicleController = {
    fetchVehicles: async (req, res, next) => {
        try {
            const data = await vehicleModel.getAllVehicles();
            res.json({ success: true, data });
        } catch (err) { next(err); }
    },

    fetchVehicleById: async (req, res, next) => {
        try {
            const data = await vehicleModel.getVehicleById(req.params.id);
            if (!data) return res.status(404).json({ success: false, message: "Vehicle not found" });
            res.json({ success: true, data });
        } catch (err) { next(err); }
    },

    addVehicle: async (req, res, next) => {
        try {
            const newVehicle = await vehicleModel.createVehicle(req.body);
            res.status(201).json({ success: true, data: newVehicle });
        } catch (err) { next(err); }
    },

    changeVehicleStatus: async (req, res, next) => {
        try {
            const updated = await vehicleModel.updateVehicleStatus(req.params.id, req.body.status);
            res.json({ success: true, data: updated });
        } catch (err) { next(err); }
    },

    removeVehicle: async (req, res, next) => {
        try {
            const success = await vehicleModel.deleteVehicleById(req.params.id);
            if (!success) return res.status(404).json({ message: "Vehicle not found" });
            res.json({ success: true, message: "Vehicle deleted" });
        } catch (err) { next(err); }
    }
};

module.exports = vehicleController;