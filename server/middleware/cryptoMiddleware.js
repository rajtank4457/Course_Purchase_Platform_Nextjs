import { decryptData, encryptData } from "../utils/cryptoHelper.js";

const DEBUG_MODE = process.env.RESPONSE_DEBUG_MODE === "1";

export const decryptRequest = (req, res, next) => {
    try {
        if (req.method === "GET" || req.method === "DELETE") {
            return next();
        }

        const contentType = req.headers["content-type"] || "";

        if (contentType.includes("multipart/form-data")) {
            return next();
        }

        if (!req.body || Object.keys(req.body).length === 0) {
            return next();
        }

        if (req.body.encrypted === true) {
            const { payload } = req.body;

            if (!payload) {
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

        return res.status(401).json({
            encrypted: false,
            success: false,
            message: error.message || "Invalid encrypted request",
        });
    }
};

export const sendEncrypted = (res, statusCode, data) => {
    try {
        const encryptedPayload = encryptData(data);

        if (process.env.NODE_ENV !== "production" && DEBUG_MODE) {
            return res.status(statusCode).json({
                encrypted: true,
                payload: encryptedPayload.data,
                plain: data,
            });
        }

        return res.status(statusCode).json({
            encrypted: true,
            payload: encryptedPayload.data,
        });
    } catch (error) {
        console.log("ENCRYPT ERROR:", error.message);

        return res.status(500).json({
            success: false,
            message: "Response encryption failed",
        });
    }
};