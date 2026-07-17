"use client";

import ChatRoundedIcon from "@mui/icons-material/ChatRounded";

import { Box, Typography } from "@mui/material";

export default function EmptyChat() {
  return (
    <Box
      display="flex"
      flexDirection="column"
      justifyContent="center"
      alignItems="center"
      height="100%"
      gap={2}
    >
      <ChatRoundedIcon
        sx={{
          fontSize: 80,
          color: "text.disabled",
        }}
      />

      <Typography variant="h6" color="text.secondary">
        Select a conversation
      </Typography>
    </Box>
  );
}
