"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid2,
  InputAdornment,
  MenuItem,
  Paper,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { apiRequest, subscriptionApi } from "@/lib/apiHelper";

const defaultForm = {
  planName: "",
  targetRole: "both",
  price: "",
  durationDays: 30,
  maxStudents: "",
  maxFaculty: "",
  maxCourses: "",
  maxChapters: "",
  maxExams: "",
  storageLimit: 2,
  maxFileUploadSize: 100,
  status: true,
  permissions: [],
};

export default function PlanDialog({ open, plan, onClose, onSave }) {
  const isEdit = Boolean(plan);

  const [form, setForm] = useState(defaultForm);
  const [permissions, setPermissions] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [selectedModule, setSelectedModule] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (plan) {
      setForm({
        ...defaultForm,
        ...plan,

        storageLimit: plan.storageLimit
          ? Math.round(plan.storageLimit / (1024 * 1024 * 1024))
          : 2,

        maxFileUploadSize: plan.maxFileUploadSize
          ? Math.round(plan.maxFileUploadSize / (1024 * 1024))
          : 100,

        permissions: plan.permissions || [],
      });
    } else {
      setForm(defaultForm);
    }

    setErrors({});
  }, [plan, open]);

  const loadPermissions = async () => {
    const res = await apiRequest(subscriptionApi.getPermissions);

    if (res.success) {
      const data = res.data.data || [];

      setPermissions(data);

      const grouped = data.reduce((acc, permission) => {
        const module = permission.moduleName;

        if (!acc[module]) {
          acc[module] = [];
        }

        acc[module].push(permission);

        return acc;
      }, {});

      setGroupedPermissions(grouped);

      const modules = Object.keys(grouped);

      if (modules.length) {
        const firstSelected = modules.find((module) =>
          grouped[module].some((permission) =>
            (plan?.permissions || []).includes(permission.permissionId),
          ),
        );

        setSelectedModule(firstSelected || modules[0]);
      }
    }
  };

  useEffect(() => {
    loadPermissions();
  }, []);

  const handleChange = (field) => (event) => {
    const value =
      event.target.type === "checkbox"
        ? event.target.checked
        : event.target.value;

    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const togglePermission = (permission) => {
    setForm((prev) => ({
      ...prev,

      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter((p) => p !== permission)
        : [...prev.permissions, permission],
    }));
  };

  const handleSubmit = () => {
    const newErrors = {};

    if (!form.planName.trim()) {
      newErrors.planName = "Plan Name is required";
    }

    if (!form.price || Number(form.price) <= 0) {
      newErrors.price = "Price must be greater than 0";
    }

    if (!form.durationDays || Number(form.durationDays) <= 0) {
      newErrors.durationDays = "Duration is required";
    }

    if (!form.maxStudents || Number(form.maxStudents) < 0) {
      newErrors.maxStudents = "Maximum Students is required";
    }

    if (!form.maxFaculty || Number(form.maxFaculty) < 0) {
      newErrors.maxFaculty = "Maximum Faculty is required";
    }

    if (!form.maxCourses || Number(form.maxCourses) < 0) {
      newErrors.maxCourses = "Maximum Courses is required";
    }

    if (!form.maxChapters || Number(form.maxChapters) < 0) {
      newErrors.maxChapters = "Maximum Chapters is required";
    }

    if (!form.maxExams || Number(form.maxExams) < 0) {
      newErrors.maxExams = "Maximum Exams is required";
    }

    if (!form.storageLimit || Number(form.storageLimit) <= 0) {
      newErrors.storageLimit = "Storage is required";
    }

    if (!form.maxFileUploadSize || Number(form.maxFileUploadSize) <= 0) {
      newErrors.maxFileUploadSize = "Upload size is required";
    }

    if (form.permissions.length === 0) {
      newErrors.permissions = "Select at least one permission.";
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    const payload = {
      ...form,

      isActive: form.status ? 1 : 0,

      storageLimit: Number(form.storageLimit) * 1024 * 1024 * 1024,

      maxFileUploadSize: Number(form.maxFileUploadSize) * 1024 * 1024,

      price: Number(form.price),

      durationDays: Number(form.durationDays),

      maxStudents: Number(form.maxStudents),

      maxFaculty: Number(form.maxFaculty),

      maxCourses: Number(form.maxCourses),

      maxChapters: Number(form.maxChapters),

      maxExams: Number(form.maxExams),
    };

    payload.permissions = form.permissions;
    onSave?.(payload);

    onClose?.();
  };

  return (
    <Dialog
      open={open}
      fullWidth
      maxWidth="xl"
      PaperProps={{
        sx: {
          borderRadius: 4,
          height: "92vh",
          overflow: "hidden",
          bgcolor: "background.default",
        },
      }}
    >
      <DialogTitle
        sx={{
          py: 2.5,
          px: 3,
          borderBottom: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
        }}
      >
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Box>
            <Typography variant="h5" fontWeight={700}>
              {isEdit ? "Edit Subscription Plan" : "Create Subscription Plan"}
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Configure plan details, limits and permissions
            </Typography>
          </Box>

          <Switch checked={form.status} onChange={handleChange("status")} />
        </Stack>
      </DialogTitle>

      <DialogContent
        dividers
        sx={{
          bgcolor: "#f7f8fc",
        }}
      >
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={3}>
              Basic Information
            </Typography>

            <Grid2 container spacing={3}>
              <Grid2 item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Plan Name"
                  value={form.planName}
                  onChange={handleChange("planName")}
                  error={Boolean(errors.planName)}
                  helperText={errors.planName}
                />
              </Grid2>

              <Grid2 item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Target Role"
                  value={form.targetRole}
                  onChange={handleChange("targetRole")}
                >
                  <MenuItem value="both">Both</MenuItem>

                  <MenuItem value="student">Student</MenuItem>

                  <MenuItem value="faculty">Faculty</MenuItem>
                </TextField>
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Price"
                  type="number"
                  value={form.price}
                  onChange={handleChange("price")}
                  error={Boolean(errors.price)}
                  helperText={errors.price}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <CurrencyRupeeIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Duration (Days)"
                  value={form.durationDays}
                  error={Boolean(errors.durationDays)}
                  helperText={errors.durationDays}
                  onChange={handleChange("durationDays")}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.status}
                      onChange={handleChange("status")}
                    />
                  }
                  label={form.status ? "Active" : "Inactive"}
                />
              </Grid2>
            </Grid2>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={3}>
              Plan Limits
            </Typography>

            <Grid2 container spacing={3}>
              <Grid2
                size={{
                  xs: 12,
                  md: 4,
                }}
              >
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Students"
                  value={form.maxStudents}
                  error={Boolean(errors.maxStudents)}
                  helperText={errors.maxStudents}
                  onChange={handleChange("maxStudents")}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Faculty"
                  value={form.maxFaculty}
                  error={Boolean(errors.maxFaculty)}
                  helperText={errors.maxFaculty}
                  onChange={handleChange("maxFaculty")}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Courses"
                  value={form.maxCourses}
                  error={Boolean(errors.maxCourses)}
                  helperText={errors.maxCourses}
                  onChange={handleChange("maxCourses")}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Chapters"
                  value={form.maxChapters}
                  error={Boolean(errors.maxChapters)}
                  helperText={errors.maxChapters}
                  onChange={handleChange("maxChapters")}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Exams"
                  value={form.maxExams}
                  error={Boolean(errors.maxExams)}
                  helperText={errors.maxExams}
                  onChange={handleChange("maxExams")}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Storage (GB)"
                  helperText="Example: 2 GB, 5 GB, 10 GB"
                  value={form.storageLimit}
                  onChange={handleChange("storageLimit")}
                />
              </Grid2>

              <Grid2 item xs={12} md={4}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Upload Size (MB)"
                  helperText="Example: 25 MB, 50 MB, 100 MB"
                  value={form.maxFileUploadSize}
                  onChange={handleChange("maxFileUploadSize")}
                />
              </Grid2>
            </Grid2>
          </Paper>

          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              mb: 3,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              mb={3}
            >
              <Typography variant="h6" fontWeight={700}>
                Plan Permissions
              </Typography>

              <Stack direction="row" spacing={1}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      permissions: [
                        ...new Set([
                          ...prev.permissions,
                          ...(groupedPermissions[selectedModule] || []).map(
                            (p) => p.permissionId,
                          ),
                        ]),
                      ],
                    }))
                  }
                >
                  Select All
                </Button>

                <Button
                  size="small"
                  color="error"
                  variant="outlined"
                  onClick={() =>
                    setForm((prev) => ({
                      ...prev,
                      permissions: prev.permissions.filter(
                        (id) =>
                          !(groupedPermissions[selectedModule] || [])
                            .map((p) => p.permissionId)
                            .includes(id),
                      ),
                    }))
                  }
                >
                  Clear
                </Button>
              </Stack>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Stack spacing={2}>
              <TextField
                select
                fullWidth
                label="Permission Module"
                value={selectedModule}
                onChange={(e) => setSelectedModule(e.target.value)}
              >
                {Object.keys(groupedPermissions).map((module) => (
                  <MenuItem key={module} value={module}>
                    {module}
                  </MenuItem>
                ))}
              </TextField>

              <Grid2 container spacing={1}>
                {(groupedPermissions[selectedModule] || []).map(
                  (permission) => (
                    <Grid2
                      item
                      xs={12}
                      sm={6}
                      md={4}
                      key={permission.permissionId}
                    >
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1,
                          borderRadius: 2,
                          transition: ".25s",
                          bgcolor: form.permissions.includes(
                            permission.permissionId,
                          )
                            ? "success.50"
                            : "background.paper",
                        }}
                      >
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={form.permissions.includes(
                                permission.permissionId,
                              )}
                              onChange={() =>
                                togglePermission(permission.permissionId)
                              }
                            />
                          }
                          label={permission.permissionName}
                        />
                      </Paper>
                    </Grid2>
                  ),
                )}
              </Grid2>
            </Stack>
          </Paper>
        </Stack>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2.5,
          borderTop: "1px solid",
          borderColor: "divider",
          justifyContent: "space-between",
        }}
      >
        <Box>
          {errors.permissions && (
            <Typography color="error" variant="body2">
              {errors.permissions}
            </Typography>
          )}
        </Box>

        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={onClose}>
            Cancel
          </Button>

          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={handleSubmit}
          >
            {isEdit ? "Update Plan" : "Create Plan"}
          </Button>
        </Stack>
      </DialogActions>
    </Dialog>
  );
}
