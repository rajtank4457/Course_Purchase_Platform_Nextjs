"use client";

import { Box, Typography } from "@mui/material";

export default function DateDivider({ text }) {
  return (
    <Box display="flex" justifyContent="center" my={2}>
      <Typography
        sx={{
          px: 2,
          py: 0.5,
          bgcolor: "#EDEDED",
          borderRadius: 5,
          fontSize: 12,
        }}
      >
        {text}
      </Typography>
    </Box>
  );
}
