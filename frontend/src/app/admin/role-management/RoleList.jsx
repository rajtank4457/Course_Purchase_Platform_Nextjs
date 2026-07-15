"use client";

import {
  Avatar,
  Box,
  Chip,
  Divider,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import SchoolIcon from "@mui/icons-material/School";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";

const getRoleIcon = (role = "") => {
  switch (role.toLowerCase()) {
    case "admin":
      return <ManageAccountsIcon fontSize="small" />;

    case "faculty":
      return <SchoolIcon fontSize="small" />;

    case "super_admin":
    case "super admin":
      return <SecurityIcon fontSize="small" />;

    default:
      return <SecurityIcon fontSize="small" />;
  }
};

const getRoleColor = (role = "") => {
  switch (role.toLowerCase()) {
    case "admin":
      return "primary";

    case "faculty":
      return "success";

    case "super_admin":
      return "error";

    default:
      return "default";
  }
};

export default function RoleList({
  roles = [],
  loading = false,
  selectedRole,
  onSelect,
}) {
  if (loading) {
    return (
      <Stack spacing={1}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Skeleton key={i} variant="rounded" height={70} />
        ))}
      </Stack>
    );
  }

  if (!roles.length) {
    return (
      <Stack
        height="100%"
        justifyContent="center"
        alignItems="center"
        spacing={2}
      >
        <SecurityIcon
          sx={{
            fontSize: 55,
            color: "text.disabled",
          }}
        />

        <Typography color="text.secondary">No users found</Typography>
      </Stack>
    );
  }

  return (
    <List
      disablePadding
      sx={{
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
    >
      {roles.map((user) => {
        const selected = selectedRole?.adminId === user.adminId;

        return (
          <Box key={user.adminId}>
            <ListItemButton
              selected={selected}
              onClick={() => onSelect(user)}
              sx={{
                borderRadius: 2,
                alignItems: "flex-start",
                py: 1.5,

                borderLeft: selected ? "4px solid" : "4px solid transparent",

                borderColor: selected ? "primary.main" : "transparent",

                transition: ".2s",

                "&.Mui-selected": {
                  bgcolor: "primary.50",
                },

                "&:hover": {
                  bgcolor: "action.hover",
                },
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: selected ? "primary.main" : "primary.light",
                  }}
                >
                  {getRoleIcon(user.role)}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                disableTypography
                primary={
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                  >
                    <Typography fontWeight={700} fontSize={15}>
                      {user.adminName}
                    </Typography>

                    <Chip
                      size="small"
                      label={user.role.toUpperCase()}
                      color={getRoleColor(user.role)}
                    />
                  </Stack>
                }
                secondary={
                  <Box mt={0.5}>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>

                    <Typography variant="caption" color="text.secondary">
                      {user.permissionCount} Permissions
                    </Typography>
                  </Box>
                }
              />
            </ListItemButton>

            <Divider sx={{ mt: 1 }} />
          </Box>
        );
      })}
    </List>
  );
}
