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

export default function AddStudentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [student, setStudent] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNo: "",
    address: "",
    city: "",
    state: "",
    dob: "",
    isActive: 1,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setStudent((prev) => ({
      ...prev,
      [name]: name === "isActive" ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    try {
      setLoading(true);

      const res = await axios.post(`${API_URL}/auth/add-student`, student, {
        withCredentials: true,
      });

      alert(res.data.message || "Student added successfully");
      router.push("/admin/dashboard");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add student");
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
          Add New Student
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
              label="First Name"
              name="firstName"
              value={student.firstName}
              onChange={handleChange}
              required
            />
            <TextField
              label="Last Name"
              name="lastName"
              value={student.lastName}
              onChange={handleChange}
              required
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={student.email}
              onChange={handleChange}
              required
            />
            <TextField
              label="Password"
              name="password"
              type="password"
              value={student.password}
              onChange={handleChange}
              required
            />
            <TextField
              label="Phone Number"
              name="phoneNo"
              value={student.phoneNo}
              onChange={handleChange}
              required
            />
            <TextField
              label="Address"
              name="address"
              value={student.address}
              onChange={handleChange}
              required
              multiline
              rows={1}
            />
            <TextField
              label="City"
              name="city"
              value={student.city}
              onChange={handleChange}
              required
            />
            <TextField
              label="State"
              name="state"
              value={student.state}
              onChange={handleChange}
              required
            />

            <TextField
              label="Date of Birth"
              name="dob"
              type="date"
              value={student.dob}
              onChange={handleChange}
              required
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <FormControl required>
              <InputLabel>Status</InputLabel>
              <Select
                name="isActive"
                label="Status"
                value={student.isActive}
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
              onClick={() => router.push("/admin/dashboard")}
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
              {loading ? "Adding..." : "Add Student"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
