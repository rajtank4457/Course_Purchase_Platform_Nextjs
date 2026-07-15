"use client";

import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Grid2,
  Snackbar,
  CircularProgress,
  Stack,
} from "@mui/material";

import Toolbar from "./Toolbar";
import RoleList from "./RoleList";
import PermissionPanel from "./PermissionPanel";
import SaveBar from "./SaveBar";

import {
  apiRequest,
  organizationApi,
  roleManagementApi,
} from "@/lib/apiHelper";

export default function RoleManagementClient() {
  const [organizations, setOrganizations] = useState([]);
  const [selectedOrganization, setSelectedOrganization] = useState("");

  const [roles, setRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState(null);

  const [permissions, setPermissions] = useState([]);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");

  const [statusFilter, setStatusFilter] = useState("all");

  const [loadingOrganizations, setLoadingOrganizations] = useState(true);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [hasChanges, setHasChanges] = useState(false);
  const [loadingRoles, setLoadingRoles] = useState(false);
  const [saving, setSaving] = useState(false);

  const [snackbar, setSnackbar] = useState({
    open: false,
    severity: "success",
    message: "",
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setLoadingOrganizations(true);

      const service = organizationApi.getActiveOrganizations;

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      if (res.success) {
        setOrganizations(res.data.data || []);

        setSelectedOrganization("");
        setRoles([]);
        setSelectedRole(null);
        setPermissions([]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrganizations(false);
    }
  };

  const loadRoles = async () => {
    try {
      setLoadingRoles(true);

      const service = roleManagementApi.getRoles(selectedOrganization);

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      if (res.success) {
        setRoles(res.data.data || []);

        if (res.data.data?.length) {
          setSelectedRole(res.data.data[0]);
        } else {
          setSelectedRole(null);

          setPermissions([]);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingRoles(false);
    }
  };

  useEffect(() => {
    if (!selectedOrganization) return;

    loadRoles();
  }, [selectedOrganization]);

  useEffect(() => {
    if (!selectedRole) return;

    loadPermission();
  }, [selectedRole]);

  const loadPermission = async () => {
    try {
      setLoadingPermissions(true);

      const service = roleManagementApi.getRolePermissions(selectedRole.roleId);

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      console.log(res.data.data);

      if (res.success) {
        const formatted = (res.data.data || []).map((module) => ({
          ...module,
          features: module.features.map((feature) => ({
            ...feature,
            permissions: {
              view: feature.permissions.view,
              add: feature.permissions.create,
              edit: feature.permissions.update,
              delete: feature.permissions.delete,
            },
          })),
        }));

        setPermissions(formatted);
        setHasChanges(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPermissions(false);
    }
  };

  const filteredRoles = roles.filter((user) => {
    const matchesSearch = (user.adminName || "")
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchesRole =
      roleFilter === "all"
        ? true
        : (user.role || "").toLowerCase() === roleFilter;

    const matchesStatus =
      statusFilter === "all" ? true : statusFilter === "active";

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handlePermissionChange = (moduleName, featureId, action, checked) => {
    setPermissions((prev) =>
      prev.map((module) => {
        if (module.moduleName !== moduleName) return module;

        return {
          ...module,

          features: module.features.map((feature) => {
            if (feature.featureId !== featureId) return feature;

            const currentPermission = feature.permissions[action];

            if (!currentPermission) {
              return feature;
            }

            return {
              ...feature,
              permissions: {
                ...feature.permissions,
                [action]: {
                  ...currentPermission,
                  allowed: checked,
                },
              },
            };
          }),
        };
      }),
    );

    setHasChanges(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      const formattedPermissions = [];

      permissions.forEach((module) => {
        module.features.forEach((feature) => {
          Object.values(feature.permissions || {}).forEach((permission) => {
            if (!permission?.permissionId) return;

            formattedPermissions.push({
              permissionId: permission.permissionId,
              allowed: permission.allowed,
            });
          });
        });
      });

      const service = roleManagementApi.updateRolePermissions(
        selectedRole.roleId,
      );

      const req = {
        method: "PUT",
        data: {
          permissions: formattedPermissions,
        },
      };

      const res = await apiRequest(service, req);

      if (res.success) {
        setHasChanges(false);

        setSnackbar({
          open: true,
          severity: "success",
          message: res.message,
        });
      } else {
        setSnackbar({
          open: true,
          severity: "error",
          message: res.message,
        });
      }
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message:
          err?.response?.data?.message ||
          err?.message ||
          "Unable to update permissions.",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = () => {
    loadOrganizations();
  };

  const handleOrganizationChange = (organizationId) => {
    setSelectedOrganization(organizationId);

    setRoles([]);
    setSelectedRole(null);
    setPermissions([]);
  };

  return (
    <Box
      sx={{
        p: 3,
        bgcolor: "background.default",
        minHeight: "100vh",
      }}
    >
      <Box mb={3}>
        <Toolbar
          organizations={Array.isArray(organizations) ? organizations : []}
          selectedOrganization={selectedOrganization}
          setSelectedOrganization={handleOrganizationChange}
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          totalUsers={roles.length}
          loading={loadingOrganizations}
          onRefresh={handleRefresh}
        />
      </Box>

      <Grid2 container spacing={2} alignItems="stretch">
        <Grid2
          size={{
            xs: 12,
            md: 4,
            lg: 3,
          }}
        >
          <Card
            elevation={0}
            sx={{
              borderRadius: 3,
              border: 1,
              borderColor: "divider",
              height: "calc(100vh - 210px)",
              overflow: "hidden",
            }}
          >
            <CardContent
              sx={{
                p: 2,
                height: "100%",
                overflow: "auto",
              }}
            >
              <RoleList
                roles={filteredRoles}
                loading={loadingRoles}
                selectedRole={selectedRole}
                onSelect={setSelectedRole}
              />
            </CardContent>
          </Card>
        </Grid2>

        <Grid2
          size={{
            xs: 12,
            md: 8,
            lg: 9,
          }}
        >
          {loadingPermissions ? (
            <Card
              sx={{
                borderRadius: 3,
                height: "calc(100vh - 210px)",
              }}
            >
              <Stack
                justifyContent="center"
                alignItems="center"
                height="100%"
                spacing={2}
              >
                <CircularProgress />

                <Alert severity="info">Loading permissions...</Alert>
              </Stack>
            </Card>
          ) : (
            <PermissionPanel
              role={selectedRole}
              permissions={permissions}
              onPermissionChange={handlePermissionChange}
            />
          )}
        </Grid2>
      </Grid2>

      <SaveBar
        open={hasChanges}
        loading={saving}
        onSave={handleSave}
        onReset={loadPermission}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
