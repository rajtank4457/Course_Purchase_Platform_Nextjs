"use client";

import { Paper, Typography, IconButton, Box } from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/CloseRounded";

import { useChat } from "@/context/ChatContext";

export default function ReplyPreview() {
  const {
    replyMessage,

    setReplyMessage,
  } = useChat();

  if (!replyMessage) {
    return null;
  }

  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.5,

        mb: 1,

        borderLeft: "4px solid #25D366",

        background: "#f5f5f5",
      }}
    >
      <Box display="flex" justifyContent="space-between">
        <Box>
          <Typography fontWeight={700} fontSize={13}>
            Replying to
          </Typography>

          <Typography fontSize={13} color="text.secondary" noWrap>
            {replyMessage.messageType === "text"
              ? replyMessage.message
              : "📎 Attachment"}
          </Typography>
        </Box>

        <IconButton size="small" onClick={() => setReplyMessage(null)}>
          <CloseRoundedIcon />
        </IconButton>
      </Box>
    </Paper>
  );
}
