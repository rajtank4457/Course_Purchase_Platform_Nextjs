"use client";

import { Box, Typography, IconButton } from "@mui/material";

import DoneAllRoundedIcon from "@mui/icons-material/DoneAllRounded";
import ReplyRoundedIcon from "@mui/icons-material/ReplyRounded";

import { useChat } from "@/context/ChatContext";

export default function MessageBubble({ message }) {
  const { selectedConversation, setReplyMessage } = useChat();

  const isMine = message.senderId !== selectedConversation.userId;

  return (
    <Box
      display="flex"
      justifyContent={isMine ? "flex-end" : "flex-start"}
      mb={1.2}
    >
      <Box
        sx={{
          maxWidth: "70%",
          bgcolor: isMine ? "#DCF8C6" : "#ffffff",
          px: 2,
          py: 1,
          borderRadius: 3,
          boxShadow: "0 1px 3px rgba(0,0,0,.08)",
        }}
      >
        <Box display="flex" justifyContent="flex-end" mb={0.5}>
          <IconButton size="small" onClick={() => setReplyMessage(message)}>
            <ReplyRoundedIcon fontSize="small" />
          </IconButton>
        </Box>

        {message.fileUrl &&
          (message.messageType === "file" ? (
            message.fileName.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
              <img
                src={`${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl}`}
                alt=""
                style={{
                  maxWidth: 250,
                  borderRadius: 10,
                  marginBottom: 8,
                }}
              />
            ) : (
              <a
                href={`${process.env.NEXT_PUBLIC_API_URL}${message.fileUrl}`}
                target="_blank"
                rel="noreferrer"
              >
                📄 {message.fileName}
              </a>
            )
          ) : null)}

        {message.message && (
          <Typography
            sx={{
              whiteSpace: "pre-wrap",
            }}
          >
            {message.message}
          </Typography>
        )}

        <Box
          display="flex"
          justifyContent="flex-end"
          alignItems="center"
          gap={0.5}
          mt={0.5}
        >
          <Typography fontSize={11} color="text.secondary">
            {new Date(message.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Typography>

          {isMine && (
            <DoneAllRoundedIcon
              sx={{
                fontSize: 16,
                color: message.isSeen ? "#2196f3" : "#9e9e9e",
              }}
            />
          )}
        </Box>
      </Box>
    </Box>
  );
}
