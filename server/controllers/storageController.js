import { runQuery, findOne } from "../helpers/dbHelper.js";
import { sendEncrypted } from "../middleware/cryptoMiddleware.js";
import { asyncHandler } from "../helpers/asyncHandler.js";

const formatBytes = (bytes) => {
    const gb = 1024 * 1024 * 1024;
    const mb = 1024 * 1024;

    if (bytes >= gb) {
        return `${(bytes / gb).toFixed(2)} GB`;
    }

    return `${(bytes / mb).toFixed(2)} MB`;
};

export const getStorageInfo = asyncHandler(async (req, res) => {
    const organizationId = req.organizationId;

    const storage = await findOne(
        `
        SELECT

        COALESCE(
        (
        SELECT SUM(fileSize)
        FROM chapter_sources
        WHERE organizationId=?
        ),0)

        +

        COALESCE(
        (
        SELECT SUM(thumbnailSize)
        FROM course_details
        WHERE organizationId=?
        ),0)

        AS usedStorage
        `,
        [organizationId, organizationId]
    );

    const usedStorage = Number(storage?.usedStorage || 0);

    const plan = await findOne(
        `
        SELECT
            sp.storageLimit
        FROM organization_subscriptions os
        INNER JOIN subscription_plans sp
            ON sp.planId = os.planId
        WHERE os.organizationId = ?
        AND os.isActive = 1
        LIMIT 1
        `,
        [organizationId]
    );

    const limit = Number(plan?.storageLimit || 0);

    const percentage =
        limit === 0 ? 0 : Number(((usedStorage / limit) * 100).toFixed(2));

    return sendEncrypted(res, 200, {
        success: true,
        data: {
            usedBytes: usedStorage,
            limitBytes: limit,
            used: formatBytes(usedStorage),
            limit: formatBytes(limit),
            percentage,
        },
    });
});