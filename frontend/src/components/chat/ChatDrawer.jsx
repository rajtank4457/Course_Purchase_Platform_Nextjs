"use client";

import { Drawer, Box, Divider, Typography, IconButton } from "@mui/material";
import ConversationList from "./ConversationList";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { useChat } from "@/context/ChatContext";
import EmptyChat from "./EmptyChat";
import useSocketChat from "@/hooks/useSocketChat";
import ChatWindow from "./ChatWindow";

export default function ChatDrawer() {
  const {
    drawerOpen,

    setDrawerOpen,
  } = useChat();

  useSocketChat();

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={() => setDrawerOpen(false)}
      PaperProps={{
        sx: {
          width: 900,
          maxWidth: "100%",
        },
      }}
    >
      <Box display="flex" flexDirection="column" height="100%">
        {/* Header */}

        <Box
          px={2}
          py={1.5}
          display="flex"
          alignItems="center"
          justifyContent="space-between"
        >
          <Typography variant="h6" fontWeight={700}>
            Chats
          </Typography>

          <IconButton onClick={() => setDrawerOpen(false)}>
            <CloseRoundedIcon />
          </IconButton>
        </Box>

        <Divider />

        {/* Body */}

        <Box display="flex" flex={1} overflow="hidden">
          {/* Left */}

          <Box width={340} borderRight="1px solid" borderColor="divider">
            <ConversationList />
          </Box>

          {/* Right */}

          <Box flex={1} height="100%">
            <ChatWindow />
          </Box>
        </Box>
      </Box>
    </Drawer>
  );
}
