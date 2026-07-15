"use client";

import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";

import SaveIcon from "@mui/icons-material/Save";
import RestartAltIcon from "@mui/icons-material/RestartAlt";

export default function SaveBar({ open, loading, onSave, onReset }) {
  if (!open) return null;

  return (
    <Paper
      elevation={8}
      sx={{
        position: "fixed",
        bottom: 20,
        left: "50%",
        transform: "translateX(-50%)",
        width: {
          xs: "95%",
          md: "70%",
        },
        zIndex: 1500,
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <Alert
        severity="warning"
        sx={{
          borderRadius: 0,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          justifyContent="space-between"
          alignItems={{
            xs: "flex-start",
            md: "center",
          }}
          spacing={2}
        >
          <Box>
            <Typography fontWeight={700}>Unsaved Changes</Typography>

            <Typography variant="body2">
              Permission changes are not saved yet. Save them to update this
              role.
            </Typography>
          </Box>

          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              color="inherit"
              startIcon={<RestartAltIcon />}
              onClick={onReset}
            >
              Reset
            </Button>

            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={onSave}
              disabled={loading}
            >
              Save Changes
            </Button>
          </Stack>
        </Stack>
      </Alert>
    </Paper>
  );
}
