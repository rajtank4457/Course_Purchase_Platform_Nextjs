"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { Box, CircularProgress } from "@mui/material";

import SubscriptionModal from "@/components/SubscriptionModal";
import UnauthorizedPage from "@/components/common/UnauthorizedPage";

import { canAccessAdminPage } from "@/utils/accessControl";

export default function AdminAccessWrapper({
  permission,
  permissions = [],
  mode = "all",
  children,
}) {
  const router = useRouter();

  const permissionList = permission ? [permission] : permissions;

  const [checkingAccess, setCheckingAccess] = useState(true);
  const [subscriptionRequired, setSubscriptionRequired] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    if (!permissionList.length) {
      setAccessDenied(true);
      setCheckingAccess(false);
      return;
    }

    const results = permissionList.map((key) => canAccessAdminPage(key));

    const notLoggedIn = results.find((r) => r.reason === "NOT_LOGGED_IN");

    if (notLoggedIn) {
      router.replace("/login");
      return;
    }

    const noSubscription = results.find((r) => r.reason === "NO_SUBSCRIPTION");

    if (noSubscription) {
      setSubscriptionRequired(true);
      setCheckingAccess(false);
      return;
    }

    const allowed =
      mode === "any"
        ? results.some((r) => r.allowed)
        : results.every((r) => r.allowed);

    if (!allowed) {
      setAccessDenied(true);
    }

    setCheckingAccess(false);
  }, [permissionList, mode, router]);

  const getUserEmail = () => {
    try {
      const user =
        JSON.parse(localStorage.getItem("currentUser")) ||
        JSON.parse(localStorage.getItem("user")) ||
        {};

      return user.email || "";
    } catch {
      return "";
    }
  };

  if (checkingAccess) {
    return (
      <Box
        sx={{
          minHeight: "70vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (subscriptionRequired) {
    return (
      <SubscriptionModal
        open
        email={getUserEmail()}
        onClose={() => router.replace("/login")}
        onSuccess={() => {
          window.location.href = "/admin/dashboard";
        }}
      />
    );
  }

  if (accessDenied) {
    return (
      <UnauthorizedPage
        title="Permission Required"
        message="You don't have permission to access this page. Please contact your administrator if you believe this is incorrect."
        dashboardUrl="/admin/dashboard"
      />
    );
  }

  return children;
}
