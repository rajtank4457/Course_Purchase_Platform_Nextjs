"use client";

import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

import PermissionTable from "./PermissionTable";

export default function PermissionPanel({
  role,
  permissions,
  onPermissionChange,
}) {
  const [search, setSearch] = useState("");

  const { enabled, total } = useMemo(() => {
    let enabled = 0;
    let total = 0;

    permissions?.forEach((module) => {
      module?.features?.forEach((feature) => {
        Object.values(feature?.permissions || {}).forEach((permission) => {
          total++;

          if (permission?.allowed) {
            enabled++;
          }
        });
      });
    });

    return {
      enabled,
      total,
    };
  }, [permissions]);

  const filteredPermissions = useMemo(() => {
    if (!search.trim()) return permissions;

    return permissions
      .map((module) => ({
        ...module,
        features: module.features.filter((feature) =>
          feature.featureName.toLowerCase().includes(search.toLowerCase()),
        ),
      }))
      .filter((module) => module.features.length > 0);
  }, [permissions, search]);

  if (!role) {
    return (
      <Alert severity="info" color="#fff" sx={{ fontSize: 15, fontWeight: 500, bgcolor: "#9e71d9", color: "#fff" }}>
        Select a user from the left panel to manage permissions.
      </Alert>
    );
  }

  return (
    <Card
      sx={{
        borderRadius: 3,
      }}
    >
      <CardContent>
        {/* Header */}

        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
          flexWrap="wrap"
          spacing={2}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 34 }} />

            <Box>
              <Typography variant="h6" fontWeight={700}>
                {role.adminName}
              </Typography>

              <Typography variant="body2" color="text.secondary">
                {role.email}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap">
            <Chip color="primary" label={role.role.toUpperCase()} />

            <Chip color="success" label={`Enabled ${enabled}`} />

            <Chip color="error" label={`Disabled ${total - enabled}`} />

            <Chip variant="outlined" label={`Total ${total}`} />
          </Stack>
        </Stack>

        <Divider sx={{ my: 3 }} />

        {/* Search */}

        <TextField
          fullWidth
          placeholder="Search Feature..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
          }}
          sx={{
            mb: 3,
          }}
        />

        {/* Table */}

        <Box
          sx={{
            height: "calc(100vh - 320px)",
            overflow: "hidden",
          }}
        >
          <PermissionTable
            permissions={filteredPermissions}
            onPermissionChange={onPermissionChange}
          />
        </Box>
      </CardContent>
    </Card>
  );
}
