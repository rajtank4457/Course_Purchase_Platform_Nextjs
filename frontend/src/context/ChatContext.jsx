"use client";

import { createContext, useContext, useMemo, useState } from "react";

const ChatContext = createContext(null);

export const ChatProvider = ({ children }) => {
  /* Drawer */

  const [drawerOpen, setDrawerOpen] = useState(false);

  /* Left Panel */

  const [users, setUsers] = useState([]);

  const [conversations, setConversations] = useState([]);

  /* Selected Conversation */

  const [selectedConversation, setSelectedConversation] = useState(null);

  /* Messages */

  const [messages, setMessages] = useState([]);

  /* Socket States */

  const [onlineUsers, setOnlineUsers] = useState([]);

  const [typingUsers, setTypingUsers] = useState([]);

  /* UI */

  const [loadingUsers, setLoadingUsers] = useState(false);

  const [loadingConversation, setLoadingConversation] = useState(false);

  const [loadingMessages, setLoadingMessages] = useState(false);

  /* Unread Count */

  const [unreadCount, setUnreadCount] = useState(0);

  /* Search */

  const [search, setSearch] = useState("");

  /* Attachment */

  const [selectedFile, setSelectedFile] = useState(null);

  /* Emoji */

  const [emojiOpen, setEmojiOpen] = useState(false);

  const [lastSeenUsers, setLastSeenUsers] = useState([]);

  const [replyMessage, setReplyMessage] = useState(null);

  const value = useMemo(
    () => ({
      drawerOpen,
      setDrawerOpen,

      users,
      setUsers,

      conversations,
      setConversations,

      selectedConversation,
      setSelectedConversation,

      messages,
      setMessages,

      onlineUsers,
      setOnlineUsers,

      typingUsers,
      setTypingUsers,

      loadingUsers,
      setLoadingUsers,

      loadingConversation,
      setLoadingConversation,

      loadingMessages,
      setLoadingMessages,

      unreadCount,
      setUnreadCount,

      search,
      setSearch,

      selectedFile,
      setSelectedFile,

      emojiOpen,
      setEmojiOpen,

      lastSeenUsers,
      setLastSeenUsers,

      replyMessage,
      setReplyMessage,
    }),
    [
      drawerOpen,
      users,
      conversations,
      selectedConversation,
      messages,
      onlineUsers,
      typingUsers,
      loadingUsers,
      loadingConversation,
      loadingMessages,
      unreadCount,
      search,
      selectedFile,
      emojiOpen,
      lastSeenUsers,
      replyMessage,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);

  if (!context) {
    throw new Error("useChat must be used inside ChatProvider");
  }

  return context;
};
