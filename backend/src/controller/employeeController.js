import {
    getAllEmployees,
    getEmployeeById,
    createEmployee,
    deleteEmployee
} from "../models/employeeModel.js";


export const fetchEmployees = async (req, res, next) => {
    try {
        const employees = await getAllEmployees();
        res.json(employees);
    } catch (err) {
        next(err);
    }
};


export const fetchEmployeeById = async (req, res, next) => {
    try {
        const employee = await getEmployeeById(req.params.id);

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.json(employee);
    } catch (err) {
        next(err);
    }
};


export const addEmployee = async (req, res, next) => {
    try {
        const newEmployee = await createEmployee(req.body);
        res.status(201).json(newEmployee);
    } catch (err) {
        next(err);
    }
};


export const removeEmployee = async (req, res, next) => {
    try {
        const deleted = await deleteEmployee(req.params.id);

        if (!deleted) {
            return res.status(404).json({
                success: false,
                message: "Employee not found"
            });
        }

        res.json(deleted);
    } catch (err) {
        next(err);
    }
};


