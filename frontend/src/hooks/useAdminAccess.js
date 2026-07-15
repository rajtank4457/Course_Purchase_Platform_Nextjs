"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { canAccessAdminPage } from "@/utils/accessControl";

export default function useAdminAccess(permissionKey) {
    const router = useRouter();

    const [checkingAccess, setCheckingAccess] = useState(true);
    const [accessDenied, setAccessDenied] = useState("");
    const [subscriptionRequired, setSubscriptionRequired] = useState(false);

    useEffect(() => {
        const result = canAccessAdminPage(permissionKey);

        if (!result.allowed) {
            if (result.reason === "NOT_LOGGED_IN") {
                router.replace("/login");
                return;
            }

            if (result.reason === "NO_SUBSCRIPTION") {
                setSubscriptionRequired(true);
                setCheckingAccess(false);
                return;
            }

            if (result.reason === "NO_PERMISSION") {
                setAccessDenied("You do not have permission to access this page.");
                setCheckingAccess(false);
                return;
            }
        }

        setCheckingAccess(false);
    }, [permissionKey, router]);

    return {
        checkingAccess,
        accessDenied,
        subscriptionRequired,
    };
}