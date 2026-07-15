export default function verifySuperAdmin(
    req,
    res,
    next
) {
    try {
        if (
            !req.user ||
            req.user.role !== "super_admin"
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Access denied. Super Admin only.",
            });
        }
        next();
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message,
        });
    }

}