"use client";

import {
  Box,
  Divider,
  InputAdornment,
  List,
  Typography,
  TextField,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { useMemo } from "react";

import { useChat } from "@/context/ChatContext";

import ConversationItem from "./ConversationItem";

export default function ConversationList() {
  const { conversations, users, search, setSearch } = useChat();

  // Existing conversations
  const filteredConversations = useMemo(() => {
    if (!search) return conversations;

    return conversations.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [conversations, search]);

  // Available users
  const filteredUsers = useMemo(() => {
    if (!search) return users;

    return users.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [users, search]);

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box p={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <Divider />

      <List
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 0,
        }}
      >
        {/* Existing Conversations */}

        {filteredConversations.length > 0 && (
          <>
            <Typography
              sx={{
                px: 2,
                py: 1,
                fontSize: 13,
                fontWeight: 700,
                color: "text.secondary",
              }}
            >
              Recent Chats
            </Typography>

            {filteredConversations.map((conversation) => (
              <ConversationItem
                key={conversation.conversationId}
                conversation={conversation}
                isConversation
              />
            ))}

            <Divider />
          </>
        )}

        {/* Available Users */}

        <Typography
          sx={{
            px: 2,
            py: 1,
            fontSize: 13,
            fontWeight: 700,
            color: "text.secondary",
          }}
        >
          People
        </Typography>

        {filteredUsers.map((user) => (
          <ConversationItem
            key={user.userId}
            conversation={user}
            isConversation={false}
          />
        ))}
      </List>
    </Box>
  );
}
