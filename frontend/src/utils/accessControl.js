export const getCurrentUser = () => {
  try {
    return (
      JSON.parse(localStorage.getItem("currentUser")) ||
      JSON.parse(localStorage.getItem("user")) ||
      null
    );
  } catch {
    return null;
  }
};

export const getPermissions = () => {
  try {
    const storedPermissions = JSON.parse(localStorage.getItem("permissions")) || [];

    if (storedPermissions.length) return storedPermissions;

    const user = getCurrentUser();
    return user?.permissions || [];
  } catch {
    return [];
  }
};

export const isSuperAdmin = () => {
  return getCurrentUser()?.role === "super_admin";
};

export const hasPermission = (permissionKey) => {
  if (isSuperAdmin()) return true;

  return getPermissions().includes(permissionKey);
};

export const canAccessAdminPage = (permissionKey) => {
  const user = getCurrentUser();

  if (!user) {
    return {
      allowed: false,
      reason: "NOT_LOGGED_IN",
    };
  }

  if (user.role === "super_admin") {
    return {
      allowed: true,
      reason: "SUPER_ADMIN",
    };
  }

  if (!hasPermission(permissionKey)) {
    return {
      allowed: false,
      reason: "NO_PERMISSION",
    };
  }

  return {
    allowed: true,
    reason: "ALLOWED",
  };
};