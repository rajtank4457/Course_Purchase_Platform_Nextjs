
import jwt from 'jsonwebtoken'

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token;

        if (!token) {
            return res.status(403).json({ message: "No Token Provided" });
        }

        const decoded = jwt.verify(token, process.env.JWT_KEY);

        if (decoded.type === "guest") {
            return res.status(401).json({ message: "Please login first" });
        }

        req.user = decoded;
        req.userId = decoded.id;
        req.userType = decoded.type;
        req.userRole = decoded.role;

        next();
    } catch (err) {
        return res.status(401).json({ message: "Invalid Token" });
    }
};

export default verifyToken;