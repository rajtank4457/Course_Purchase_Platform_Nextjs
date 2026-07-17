"use client";

import React from "react";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Chip,
  Divider,
  Grid2,
  Stack,
  Typography,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";

function formatStorage(bytes) {
  if (!bytes) return "-";

  const gb = bytes / (1024 * 1024 * 1024);

  if (gb >= 1) {
    return `${gb.toFixed(0)} GB`;
  }

  const mb = bytes / (1024 * 1024);

  return `${mb.toFixed(0)} MB`;
}

function formatUpload(bytes) {
  if (!bytes) return "-";

  return `${Math.round(bytes / (1024 * 1024))} MB`;
}

const DetailRow = ({ label, value }) => (
  <Grid2 container sx={{ py: 1 }}>
    <Grid2 item xs={5}>
      <Typography fontWeight={600} color="text.secondary">
        {label}
      </Typography>
    </Grid2>

    <Grid2 item xs={7}>
      {React.isValidElement(value) ? (
        value
      ) : (
        <Typography fontWeight={500}>{value}</Typography>
      )}
    </Grid2>
  </Grid2>
);

export default function ViewPlanDialog({ open, plan, onClose }) {
  if (!plan) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle
        sx={{
          fontWeight: 700,
          fontSize: 24,
        }}
      >
        Subscription Plan Details
      </DialogTitle>

      <DialogContent dividers>
        <Box>
          <DetailRow label="Plan Name" value={plan.planName} />

          <DetailRow label="Target Role" value={plan.targetRole} />

          <DetailRow
            label="Price"
            value={`₹${Number(plan.price || 0).toLocaleString("en-IN")}`}
          />

          <DetailRow label="Duration" value={`${plan.durationDays} Days`} />

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" fontWeight={700} mb={2}>
            Plan Limits
          </Typography>

          <DetailRow label="Maximum Students" value={plan.maxStudents} />

          <DetailRow label="Maximum Faculty" value={plan.maxFaculty} />

          <DetailRow label="Maximum Courses" value={plan.maxCourses} />

          <DetailRow label="Maximum Chapters" value={plan.maxChapters} />

          <DetailRow label="Maximum Exams" value={plan.maxExams} />

          <DetailRow label="Storage" value={formatStorage(plan.storageLimit)} />

          <DetailRow
            label="Maximum Upload Size"
            value={formatUpload(plan.maxFileUploadSize)}
          />

          <DetailRow
            label="Status"
            value={
              <Chip
                size="small"
                color={plan.isActive ? "success" : "error"}
                label={plan.isActive ? "Active" : "Inactive"}
              />
            }
          />

          <Divider sx={{ my: 3 }} />

          <Typography variant="h6" fontWeight={700} mb={2}>
            Plan Permissions
          </Typography>

          {plan.permissionNames && plan.permissionNames.length > 0 ? (
            <Stack spacing={1}>
              {plan.permissionNames.map((permission) => (
                <Stack
                  key={permission}
                  direction="row"
                  spacing={1}
                  alignItems="center"
                >
                  <CheckCircleIcon color="success" fontSize="small" />

                  <Typography>{permission}</Typography>
                </Stack>
              ))}
            </Stack>
          ) : (
            <Typography color="text.secondary">
              No permissions assigned.
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions
        sx={{
          p: 2,
        }}
      >
        <Button variant="contained" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
