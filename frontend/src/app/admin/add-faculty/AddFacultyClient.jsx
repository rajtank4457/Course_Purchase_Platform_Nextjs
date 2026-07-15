"use client";

import { useState } from "react";
import { apiRequest, facultyApi } from "@/lib/apiHelper";
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

export default function AddFacultyClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [faculty, setFaculty] = useState({
    password: "",
    adminName: "",
    gender: "",
    phNo: "",
    email: "",
    isActive: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFaculty((prev) => ({
      ...prev,
      [name]: name === "isActive" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const res = await apiRequest(facultyApi.addFaculty, {
        method: "POST",
        data: faculty,
      });

      if (!res.success) {
        alert(res.message || "Failed to add faculty");
        return;
      }

      alert(res.data?.message || "Faculty added successfully");

      router.push("/admin/faculty");
    } catch (err) {
      alert("Failed to add faculty");
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
          Add New Faculty
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
              label="Faculty Name"
              name="adminName"
              value={faculty.adminName}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Password"
              name="password"
              type="password"
              value={faculty.password}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Email"
              name="email"
              type="email"
              value={faculty.email}
              onChange={handleChange}
              fullWidth
              required
            />

            <TextField
              label="Phone Number"
              name="phNo"
              value={faculty.phNo}
              onChange={handleChange}
              fullWidth
              required
            />

            <FormControl fullWidth required>
              <InputLabel>Gender</InputLabel>

              <Select
                name="gender"
                label="Gender"
                value={faculty.gender}
                onChange={handleChange}
              >
                <MenuItem value="Male">Male</MenuItem>
                <MenuItem value="Female">Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
            </FormControl>

            <TextField label="Role" value="Faculty" fullWidth disabled />

            <FormControl fullWidth required>
              <InputLabel>Status</InputLabel>

              <Select
                name="isActive"
                label="Status"
                value={faculty.isActive}
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
              onClick={() => router.push("/admin/faculty")}
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
              {loading ? "Adding..." : "Add Faculty"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
