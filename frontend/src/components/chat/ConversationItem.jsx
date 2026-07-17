"use client";

import { Avatar, Badge, Box, Typography } from "@mui/material";

import { useChat } from "@/context/ChatContext";

export default function ConversationItem({ conversation }) {
  const { selectedConversation, setSelectedConversation } = useChat();

  const isSelected =
    selectedConversation?.conversationId === conversation.conversationId;

  return (
    <Box
      onClick={() => setSelectedConversation(conversation)}
      sx={{
        px: 2,
        py: 1.5,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: 2,
        transition: "0.25s",

        bgcolor: isSelected ? "action.selected" : "transparent",

        "&:hover": {
          bgcolor: "action.hover",
        },
      }}
    >
      <Badge
        overlap="circular"
        variant="dot"
        color={conversation.isOnline ? "success" : "default"}
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Avatar src={conversation.profileImage}>
          {conversation.name?.charAt(0)}
        </Avatar>
      </Badge>

      <Box flex={1} minWidth={0}>
        <Typography fontWeight={600} noWrap>
          {conversation.name}
        </Typography>

        <Typography variant="body2" color="text.secondary" noWrap>
          {conversation.lastMessage || "Start Conversation"}
        </Typography>
      </Box>

      <Box
        display="flex"
        flexDirection="column"
        alignItems="flex-end"
        gap={0.5}
      >
        <Typography variant="caption" color="text.secondary">
          {conversation.lastMessageAt
            ? new Date(conversation.lastMessageAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : ""}
        </Typography>

        {conversation.unreadCount > 0 && (
          <Box
            sx={{
              bgcolor: "#22c55e",
              color: "#fff",
              minWidth: 22,
              height: 22,
              borderRadius: 20,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {conversation.unreadCount}
          </Box>
        )}
      </Box>
    </Box>
  );
}
