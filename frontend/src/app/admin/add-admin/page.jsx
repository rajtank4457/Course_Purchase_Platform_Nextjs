"use client";

import { useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

export default function AddAdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [admin, setAdmin] = useState({
    password: "",
    adminName: "",
    gender: "",
    phNo: "",
    email: "",
    isActive: 1,
    role: "admin",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setAdmin((prev) => ({
      ...prev,
      [name]: name === "isActive" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/auth/add-admin`, admin, {
        withCredentials: true,
      });

      alert(res.data.message || "Admin added successfully");
      router.push("/admin/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add admin");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f8fafc", py: 5, px: 2 }}>
      <Paper
        sx={{
          maxWidth: 900,
          mx: "auto",
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          border: "1px solid #ede9fe",
        }}
      >
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 800,
            color: "#6d28d9",
            textAlign: "center",
            mb: 3,
          }}
        >
          Add New Admin
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Admin Name"
              name="adminName"
              value={admin.adminName}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={admin.password}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={admin.email}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Phone Number"
              name="phNo"
              value={admin.phNo}
              onChange={handleChange}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                label="Gender"
                value={admin.gender}
                onChange={handleChange}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                label="Role"
                value={admin.role}
                onChange={handleChange}
              >
                <MenuItem value="admin">Admin</MenuItem>
                <MenuItem value="super_admin">Super Admin</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>
              <Select
                name="isActive"
                label="Status"
                value={admin.isActive}
                onChange={handleChange}
              >
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/admins")}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{ bgcolor: "#6d28d9" }}
            >
              {loading ? "Adding..." : "Add Admin"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
