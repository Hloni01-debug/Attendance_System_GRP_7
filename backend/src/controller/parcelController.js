import {
    getAllParcels,
    getParcelById,
    createParcel,
    deleteParcel
} from "../models/parcelModel.js";

export const fetchParcels = async (req, res, next) => {
    try {
        const parcels = await getAllParcels();
        res.json(parcels);

    } catch (err) {
        next(err);
    }
};

export const fetchParcelById = async (req, res, next) => {
    try {
        const parcel = await getParcelById(req.params.id);

        if (!parcel)
        {
            return res.status(404).json({
                success: false, 
                message: "Parcel not found"
            });
        }

        res.json(parcel);

    } catch(err) {
        next(err);
    }
};

export const addParcel = async (req, res, next) => {
    try {
        const newParcel = await createParcel(req.body);
        res.status(201).json(newParcel);
     } catch(err) {
        next(err)
     }
};

export const removeParcel = async (req, res, next) => {
    try {
        const deleted = await deleteParcel(req.params.id);

        if (!deleted)
        {
            return res.status(404).json({
                success: false,
                message: "Parcel not found"
            });
        }
        res .json(deleted);

    } catch(err) {
        next(err);
    }
};