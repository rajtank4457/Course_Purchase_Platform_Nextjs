"use client";

import {
  Avatar,
  Box,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import CallRoundedIcon from "@mui/icons-material/CallRounded";
import VideocamRoundedIcon from "@mui/icons-material/VideocamRounded";

import { useChat } from "@/context/ChatContext";

export default function ChatHeader() {
  const { selectedConversation, onlineUsers, typingUsers } = useChat();

  if (!selectedConversation) return null;

  const isOnline = onlineUsers.some(
    (u) => u.userId === selectedConversation.userId,
  );

  const isTyping = typingUsers.some(
    (u) => u.senderId === selectedConversation.userId,
  );

  return (
    <>
      <Box
        px={2}
        py={1.5}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        bgcolor="white"
      >
        {/* Left */}

        <Stack direction="row" spacing={2} alignItems="center">
          <Avatar
            src={selectedConversation.profileImage}
            sx={{
              width: 46,
              height: 46,
            }}
          >
            {selectedConversation.name?.charAt(0)}
          </Avatar>

          <Box>
            <Typography fontWeight={700} fontSize={16}>
              {selectedConversation.name}
            </Typography>

            {isTyping ? (
              <Typography variant="caption" color="success.main">
                Typing...
              </Typography>
            ) : isOnline ? (
              <Typography variant="caption" color="success.main">
                Online
              </Typography>
            ) : (
              <Typography variant="caption" color="text.secondary">
                Offline
              </Typography>
            )}
          </Box>
        </Stack>

        {/* Right */}

        <Stack direction="row">
          <Tooltip title="Voice Call">
            <IconButton>
              <CallRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Video Call">
            <IconButton>
              <VideocamRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="Search">
            <IconButton>
              <SearchRoundedIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title="More">
            <IconButton>
              <MoreVertRoundedIcon />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      <Divider />
    </>
  );
}
