"use client";

import { Box, Typography } from "@mui/material";

export default function TypingIndicator() {
  return (
    <Box display="flex" justifyContent="flex-start" mt={1}>
      <Box
        sx={{
          bgcolor: "white",
          borderRadius: 5,
          px: 2,
          py: 1,
        }}
      >
        <Typography color="text.secondary" fontSize={13}>
          Typing...
        </Typography>
      </Box>
    </Box>
  );
}
