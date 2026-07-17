import express from "express";
import verifyToken from "../middleware/verifyToken.js";
import { checkPermission } from "../middleware/checkPermission.js";

import {
    getSubscriptionPlans,
    addSubscriptionPlan,
    updateSubscriptionPlan,
    createSubscriptionOrder,
    verifySubscriptionPayment,
    getMySubscription,
    getAdminSubscription,
    getSubscriptionPlanById,
    getSubscriptionPermissions,
    getSubscriptionPlanPermissions,
    updateSubscriptionPlanPermissions,
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.get("/plans", verifyToken, getSubscriptionPlans);

router.get("/plans/:planId", verifyToken, getSubscriptionPlanById);

router.get(
    "/permissions",
    verifyToken,
    getSubscriptionPermissions
);

router.get(
    "/plans/:planId/permissions",
    verifyToken,
    getSubscriptionPlanPermissions
);

router.put(
    "/plans/:planId/permissions",
    verifyToken,
    updateSubscriptionPlanPermissions
);

router.post(
    "/plans/add",
    verifyToken,
    checkPermission("admin.manage"),
    addSubscriptionPlan
);

router.put(
    "/plans/update/:planId",
    verifyToken,
    checkPermission("admin.manage"),
    updateSubscriptionPlan
);

router.post(
    "/create-order",
    verifyToken,
    createSubscriptionOrder
);

router.post(
    "/verify-payment",
    verifyToken,
    verifySubscriptionPayment
);

router.get(
    "/my-subscription",
    verifyToken,
    getMySubscription
);

router.get("/organization/:organizationId", verifyToken, getAdminSubscription);

export default router;