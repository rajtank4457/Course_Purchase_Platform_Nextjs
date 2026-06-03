import { connectToDatabase } from "../lib/db.js";
import bcrypt from "bcrypt";


export const getAdmins = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(`
            SELECT 
                adminId,
                adminName,
                password,
                gender,
                phNo,
                email,
                isActive,
                role
            FROM admins
            ORDER BY adminId DESC
        `);

        return res.status(200).json(rows);

    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
};

export const addAdmin = async (req, res) => {
    try {
        const { password, adminName, gender, phNo, email, isActive, role } =
            req.body;

        const db = await connectToDatabase();

        const hashPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
      INSERT INTO admins
      (
        password,
        adminName,
        gender,
        phNo,
        email,
        isActive,
        role
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
            [
                hashPassword,
                adminName,
                gender,
                phNo,
                email,
                isActive ?? 1,
                role || "admin",
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Admin added successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const updateAdmin = async (req, res) => {
    try {
        const { adminId, adminName, gender, phNo, email, isActive, role } =
            req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE admins SET
        adminName = ?,
        gender = ?,
        phNo = ?,
        email = ?,
        isActive = ?,
        role = ? 
        WHERE adminId = ?;
      `,
            [
                adminName,
                gender,
                phNo,
                email,
                isActive ?? 1,
                role || "admin",
                adminId,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Admin Updated successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const deleteAdmin = async (req, res) => {
    try {
        const { adminId } = req.body;

        if (!adminId) {
            return res.status(400).json({
                success: false,
                message: "Admin ID is required",
            });
        }

        const db = await connectToDatabase();

        const [result] = await db.query(
            "DELETE FROM admins WHERE adminId = ?",
            [adminId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Admin not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Admin deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};