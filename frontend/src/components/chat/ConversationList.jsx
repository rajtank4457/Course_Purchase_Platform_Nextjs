"use client";

import { Box, Divider, InputAdornment, List, TextField } from "@mui/material";

import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import { useMemo } from "react";

import { useChat } from "@/context/ChatContext";

import ConversationItem from "./ConversationItem";

export default function ConversationList() {
  const { conversations, search, setSearch } = useChat();

  const filteredConversations = useMemo(() => {
    if (!search) return conversations;

    return conversations.filter((item) =>
      item.name?.toLowerCase().includes(search.toLowerCase()),
    );
  }, [conversations, search]);

  return (
    <Box display="flex" flexDirection="column" height="100%">
      <Box p={2}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search chat..."
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
          overflowY: "auto",
          flex: 1,
          p: 0,
        }}
      >
        {filteredConversations.map((conversation) => (
          <ConversationItem
            key={conversation.conversationId}
            conversation={conversation}
          />
        ))}
      </List>
    </Box>
  );
}
