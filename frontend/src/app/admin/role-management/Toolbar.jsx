"use client";

import {
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid2,
  Paper,
  Stack,
  TextField,
  Typography,
  MenuItem,
  InputAdornment,
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import BusinessIcon from "@mui/icons-material/Business";
import SecurityIcon from "@mui/icons-material/Security";

export default function Toolbar({
  organizations,
  selectedOrganization,
  setSelectedOrganization,
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  statusFilter,
  setStatusFilter,
  totalUsers,
  onRefresh,
  loading,
}) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        borderRadius: 4,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      {/* Header */}

      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        flexWrap="wrap"
        spacing={2}
        mb={4}
      >
        <Box>
          <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
            User Access Management
          </Typography>

          <Typography color="text.secondary" fontSize={15}>
            Manage organization Admin & Faculty permissions
          </Typography>
        </Box>

        <Chip
          icon={<SecurityIcon sx={{ bgcolor: "#fff" }} />}
          label={`${totalUsers} Users`}
          sx={{
            height: 44,
            px: 1.5,
            borderRadius: 3,
            fontWeight: 700,
            fontSize: 14,
            color: "#fff",
            bgcolor: "#7e22ce"
          }}
        />
      </Stack>

      {/* Filters */}

      <Grid2 container spacing={2}>
        {/* Organization */}

        <Grid2
          size={{
            xs: 12,
            lg: 5,
          }}
        >
          <Autocomplete
            loading={loading}
            fullWidth
            options={organizations || []}
            getOptionLabel={(option) => option.organizationName || ""}
            value={
              organizations.find(
                (org) => org.organizationId === selectedOrganization,
              ) || null
            }
            onChange={(e, value) =>
              setSelectedOrganization(value?.organizationId || "")
            }
            renderInput={(params) => (
              <TextField
                {...params}
                label="Organization"
                placeholder="Select Organization"
                InputProps={{
                  ...params.InputProps,
                  startAdornment: (
                    <>
                      <InputAdornment position="start">
                        <BusinessIcon color="action" />
                      </InputAdornment>

                      {params.InputProps.startAdornment}
                    </>
                  ),
                }}
              />
            )}
          />
        </Grid2>

        {/* Search */}

        <Grid2
          size={{
            xs: 12,
            lg: 4,
          }}
        >
          <TextField
            fullWidth
            placeholder="Search User..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="action" />
                </InputAdornment>
              ),
            }}
          />
        </Grid2>

        {/* Role */}

        <Grid2
          size={{
            xs: 6,
            lg: 1.5,
          }}
        >
          <TextField
            select
            fullWidth
            label="Role"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <MenuItem value="all">All Roles</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
            <MenuItem value="faculty">Faculty</MenuItem>
          </TextField>
        </Grid2>

        {/* Status */}

        <Grid2
          size={{
            xs: 12,
            lg: 1.5,
          }}
        >
          <TextField
            select
            fullWidth
            label="Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </TextField>
        </Grid2>

        {/* Refresh */}

        <Grid2 xs={12} sm={4} md={3} display="flex" alignItems="stretch">
          <Button
            fullWidth
            variant="contained"
            startIcon={<RefreshIcon />}
            onClick={onRefresh}
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 700,
              fontSize: 15,
              bgcolor: "#7e22ce",
            }}
          >
            Refresh
          </Button>
        </Grid2>
      </Grid2>
    </Paper>
  );
}
