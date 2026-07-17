"use client";

import { Box } from "@mui/material";

import ChatHeader from "./ChatHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import EmptyChat from "./EmptyChat";

import { useChat } from "@/context/ChatContext";

export default function ChatWindow() {
  const { selectedConversation } = useChat();

  if (!selectedConversation) return <EmptyChat />;

  return (
    <Box
      display="flex"
      flexDirection="column"
      height="100%"
      sx={{
        background: "#efeae2",
      }}
    >
      <ChatHeader />

      <MessageList />

      <MessageInput />
    </Box>
  );
}
