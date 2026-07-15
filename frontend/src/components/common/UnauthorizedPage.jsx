"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";

import {
  Box,
  Button,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";

import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import HomeIcon from "@mui/icons-material/Home";

export default function UnauthorizedPage({
  title = "Access Denied",
  message = "You don't have permission to access this page.",
}) {
  const router = useRouter();

  const dashboardRoute = useMemo(() => {
    if (typeof window === "undefined") return "/";

    try {
      const user =
        JSON.parse(localStorage.getItem("currentUser")) ||
        JSON.parse(localStorage.getItem("user")) ||
        {};

      const role = (user.role || "").toLowerCase();

      switch (role) {
        case "super_admin":
        case "super admin":
        case "admin":
        case "faculty":
          return "/admin/dashboard";

        case "student":
        case "user":
          return "/";

        default:
          return "/";
      }
    } catch {
      return "/";
    }
  }, []);

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        bgcolor: "grey.100",
        p: 3,
      }}
    >
      <Card
        elevation={5}
        sx={{
          maxWidth: 550,
          width: "100%",
          borderRadius: 4,
          textAlign: "center",
        }}
      >
        <CardContent sx={{ p: 5 }}>
          <Stack spacing={3} alignItems="center">
            <LockOutlinedIcon
              color="error"
              sx={{
                fontSize: 90,
              }}
            />

            <Typography variant="h4" fontWeight={700}>
              {title}
            </Typography>

            <Typography color="text.secondary">{message}</Typography>

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                startIcon={<ArrowBackIcon />}
                onClick={() => router.back()}
              >
                Go Back
              </Button>

              <Button
                variant="contained"
                startIcon={<HomeIcon />}
                onClick={() => router.push(dashboardRoute)}
              >
                Go to Dashboard
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
