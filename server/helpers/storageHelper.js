import { runQuery, findOne } from "./dbHelper.js";

export const checkOrganizationStorage = async (
    organizationId,
    uploadSize
) => {

    const storage = await runQuery(
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

    const used = Number(storage[0].usedStorage);

    const plan = await findOne(
        `
SELECT sp.storageLimit
FROM organizations o
JOIN subscription_plans sp
ON sp.planId=o.planId
WHERE organizationId=?
`,
        [organizationId]
    );

    return used + uploadSize <= Number(plan.storageLimit);
};