"use client";

import { Box, Typography } from "@mui/material";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";

export default function EmptyChat() {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      height="100%"
      gap={2}
      sx={{
        bgcolor: "#f7f7f7",
      }}
    >
      <ChatRoundedIcon
        sx={{
          fontSize: 90,
          color: "#bdbdbd",
        }}
      />

      <Typography variant="h5" fontWeight={600} color="text.secondary">
        Select a conversation
      </Typography>

      <Typography color="text.secondary">
        Choose a student or faculty member to start chatting.
      </Typography>
    </Box>
  );
}
