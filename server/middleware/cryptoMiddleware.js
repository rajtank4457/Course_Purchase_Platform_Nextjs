import { decryptData, encryptData } from "../utils/cryptoHelper.js";

export const decryptRequest = (req, res, next) => {
    try {
        // Do not decrypt GET / DELETE
        if (req.method === "GET" || req.method === "DELETE") {
            return next();
        }

        // Do not decrypt form-data uploads
        const contentType = req.headers["content-type"] || "";

        if (contentType.includes("multipart/form-data")) {
            return next();
        }

        // Empty body
        if (!req.body || Object.keys(req.body).length === 0) {
            return next();
        }

        // Decrypt only encrypted request body
        if (req.body.encrypted === true) {
            const { payload } = req.body;

            if (!payload || !payload.iv || !payload.encryptedData) {
                return res.status(400).json({
                    success: false,
                    message: "Invalid encrypted payload",
                });
            }

            req.body = decryptData(payload);

            return next();
        }

        return next();
    } catch (error) {
        console.log("DECRYPT ERROR:", error.message);

        return res.status(400).json({
            success: false,
            message: error.message || "Invalid encrypted request",
        });
    }
};

export const sendEncrypted = (res, statusCode, data) => {
    try {
        return res.status(statusCode).json({
            encrypted: true,
            payload: encryptData(data),
        });
    } catch (error) {
        console.log("ENCRYPT ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Response encryption failed",
        });
    }
};