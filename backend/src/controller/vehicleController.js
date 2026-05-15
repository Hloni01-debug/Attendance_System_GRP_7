import {
    getAllVehicles,
    getVehicleById,
    createVehicle,
    updateVehicleStatus,
    deleteVehicleById
} from "../models/vehicleModel.js"

import { sendGoodRequest } from "../utils/2xx/createdResponse.js"
import { sendBadRequest } from "../utils/4xx/errorResponse.js"
import { sendNotFound } from "../utils/4xx/notFound.js"

export const fetchVehicles = async (req, res, next) => {
    try {
        const data = await getAllVehicles()
        return sendGoodRequest(req, res, "Vehicles fetched", data)
    } catch (err) {
        next(err)
    }
}


export const fetchVehicleById = async (req, res, next) => {
    try {
        const { id } = req.params

        const data = await getVehicleById(id)

        if (!data) {
            return sendNotFound(req, res, "Vehicle not found")
        }

        return sendGoodRequest(req, res, "Vehicle found", data)
    } catch (err) {
        next(err)
    }
}


export const addVehicle = async (req, res, next) => {
    try {
        const {
            registrationNumber,
            registrationExpiry,
            cofExpiry,
            maxPayload,
            make,
            model,
            status
        } = req.body

        const newVehicle = await createVehicle(
            registrationNumber,
            registrationExpiry,
            cofExpiry,
            maxPayload,
            make,
            model,
            status
        )

        if (!newVehicle) {
            return sendBadRequest(req, res, "Vehicle not created")
        }

        return sendGoodRequest(req, res, "Vehicle created", newVehicle)

    } catch (err) {
        next(err)
    }
}


export const changeVehicleStatus = async (req, res, next) => {
    try {
        const { id } = req.params
        const { status } = req.body

        const updated = await updateVehicleStatus(id, status)

        if (!updated) {
            return sendNotFound(req, res, "Vehicle not found")
        }

        return sendGoodRequest(req, res, "Vehicle status updated", updated)

    } catch (err) {
        next(err)
    }
}


export const removeVehicle = async (req, res, next) => {
    try {
        const { id } = req.params

        const deleted = await deleteVehicleById(id)

        if (!deleted) {
            return sendNotFound(req, res, "Vehicle not found")
        }

        return sendGoodRequest(req, res, "Vehicle deleted", deleted)

    } catch (err) {
        next(err)
    }
}