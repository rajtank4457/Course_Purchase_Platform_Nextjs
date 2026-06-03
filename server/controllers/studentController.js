import { connectToDatabase } from "../lib/db.js";


export const getStudents = async (req, res) => {
    try {
        const db = await connectToDatabase();

        const [rows] = await db.query(`
      SELECT 
        userId,
        firstName,
        lastName,
        email,
        phoneNo,
        address,
        city,
        state,
        dob,
        isActive
      FROM user_details
      ORDER BY userId DESC
    `);

        return res.status(200).json(rows);
    } catch (err) {
        return res.status(500).json({
            message: "Server Error",
            error: err.message,
        });
    }
};

export const addStudent = async (req, res) => {
    try {
        const {
            firstName,
            lastName,
            email,
            password,
            phoneNo,
            address,
            city,
            state,
            dob,
            isActive,
        } = req.body;

        const db = await connectToDatabase();

        const hashPassword = await bcrypt.hash(password, 10);

        await db.query(
            `
      INSERT INTO user_details
      (
        firstName,
        lastName,
        email,
        password,
        phoneNo,
        address,
        city,
        state,
        dob,
        isActive
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
            [
                firstName,
                lastName,
                email,
                hashPassword,
                phoneNo,
                address,
                city,
                state,
                dob,
                isActive ?? 1,
            ]
        );

        return res.status(201).json({
            success: true,
            message: "Student added successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const updateStudent = async (req, res) => {
    try {
        const {
            userId,
            firstName,
            lastName,
            email,
            phoneNo,
            address,
            city,
            state,
            dob,
            isActive,
        } = req.body;

        const db = await connectToDatabase();

        await db.query(
            `
      UPDATE user_details
      SET
        firstName = ?,
        lastName = ?,
        email = ?,
        phoneNo = ?,
        address = ?,
        city = ?,
        state = ?,
        dob = ?,
        isActive = ?
      WHERE userId = ?
      `,
            [
                firstName,
                lastName,
                email,
                phoneNo,
                address,
                city,
                state,
                dob,
                isActive,
                userId,
            ]
        );

        return res.status(200).json({
            success: true,
            message: "Student updated successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};

export const deleteStudent = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({
                success: false,
                message: "Student ID is required",
            });
        }

        const db = await connectToDatabase();

        const [result] = await db.query(
            "DELETE FROM user_details WHERE userId = ?",
            [userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Student not found",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Student deleted successfully",
        });
    } catch (err) {
        return res.status(500).json({
            success: false,
            message: "Server Error",
            error: err.message,
        });
    }
};
