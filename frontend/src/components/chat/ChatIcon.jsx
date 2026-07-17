"use client";

import { Badge, IconButton } from "@mui/material";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";

import { useChat } from "@/context/ChatContext";

export default function ChatIcon() {
  const { unreadCount, drawerOpen, setDrawerOpen } = useChat();

  return (
    <IconButton
      onClick={() => setDrawerOpen(!drawerOpen)}
      className="!rounded-xl !bg-purple-100 !p-2.5 !text-purple-700 hover:!bg-purple-200"
    >
      <Badge
        badgeContent={unreadCount}
        color="error"
        invisible={unreadCount === 0}
      >
        <ChatRoundedIcon />
      </Badge>
    </IconButton>
  );
}
