import { getEmployeeByEmail, createEmployee } from "../models/authModel.js";
import { sendBadRequest } from "../utils/4xx/errorResponse.js";
import { sendConflictResponse } from "../utils/4xx/conflictResponse.js";
import bcrypt from "bcrypt";
import { sendGoodRequest } from "../utils/2xx/createdResponse.js";
import { sendNotFound } from "../utils/4xx/notFound.js";
import { sendUnathorizedResponse } from "../utils/4xx/unauthorizedResponse.js";
import jwt from "jsonwebtoken";



export const registerUser = async (req, res, next) => {

    
    const {
        warehouse_id,
        role_id,
        first_name,
        last_name,
        email,
        phone,
        hourly_rate,
        password,
        prdp_expiry
    } = req.body;

    try {

        
        const existingUser = await getEmployeeByEmail(email);

        if (existingUser) {
            return sendConflictResponse(
                req,
                res,
                " Email already exists. Try logging in."
            );
        }

       
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

    
        const newlyRegisteredUser = await createEmployee(
            warehouse_id,
            role_id,
            first_name,
            last_name,
            email,
            phone,
            hourly_rate,
            hashedPassword,
            prdp_expiry
        );

        if (!newlyRegisteredUser) {
            return sendBadRequest(
                req,
                res,
                "Unable to register the employee. Please try again."
            );
        }

        sendGoodRequest(
            req,
            res,
            "You've successfully signed up.",
            newlyRegisteredUser
        );

    } catch (err) {
        next(err);
    }
};



export const userLogin = async (req, res, next) => {

    
    const { email, password } = req.body;

    try {

        
        const user = await getEmployeeByEmail(email);

        if (!user) {
            return sendNotFound(
                req,
                res,
                "Unrecognized employees email address."
            );
        }

        
        const passwordsMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!passwordsMatch) {
            return sendUnathorizedResponse(
                req,
                res,
                "Invalid credentials."
            );
        }

        
        const accessToken = jwt.sign(
            {
                employeeId: user.Employee_ID,
                firstName: user.First_Name,
                lastName: user.Last_Name,
                email: user.Email,
                roleId: user.Role_ID,
                warehouseId: user.Warehouse_ID
            },
            process.env.JWT_SECRET_TOKEN,
            {
                expiresIn: "30min"
            }
        );

        res.status(201).json({
            success: true,
            message: "Authentication successful.", 
            accessToken
        });

    } catch (error) {
        next(error);
    }
};