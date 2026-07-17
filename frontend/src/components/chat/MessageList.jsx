"use client";

import { useEffect, useRef } from "react";

import { Box, Typography } from "@mui/material";

import { useChat } from "@/context/ChatContext";
import DateDivider from "./DateDivider";
import MessageBubble from "./MessageBubble";
import TypingIndicator from "./TypingIndicator";

export default function MessageList() {
  const { messages, typingUsers } = useChat();

  const bottomRef = useRef(null);

  // Auto Scroll

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [messages, typingUsers]);

  if (!messages.length) {
    return (
      <Box flex={1} display="flex" justifyContent="center" alignItems="center">
        <Typography color="text.secondary">No messages yet.</Typography>
      </Box>
    );
  }

  return (
    <Box flex={1} overflow="auto" px={2} py={2}>
      {messages.map((message, index) => {
        const currentDate = new Date(message.createdAt).toDateString();

        const previousDate =
          index > 0
            ? new Date(messages[index - 1].createdAt).toDateString()
            : null;

        const showDate = currentDate !== previousDate;

        return (
          <Box key={message.messageId}>
            {showDate && (
              <Box flex={1} overflow="auto" p={2}>
                {messages.map((message, index) => {
                  const currentDate = new Date(
                    message.createdAt,
                  ).toDateString();

                  const previousDate =
                    index > 0
                      ? new Date(messages[index - 1].createdAt).toDateString()
                      : null;

                  return (
                    <Box key={message.messageId}>
                      {currentDate !== previousDate && (
                        <DateDivider
                          text={formatMessageDate(message.createdAt)}
                        />
                      )}

                      <MessageBubble message={message} />
                    </Box>
                  );
                })}
              </Box>
            )}

            <MessageBubble message={message} />
          </Box>
        );
      })}

      {typingUsers.length > 0 && <TypingIndicator />}

      <div ref={bottomRef} />
    </Box>
  );
}

function formatMessageDate(date) {
  const today = new Date();

  const yesterday = new Date();

  yesterday.setDate(yesterday.getDate() - 1);

  const messageDate = new Date(date);

  if (messageDate.toDateString() === today.toDateString()) {
    return "Today";
  }

  if (messageDate.toDateString() === yesterday.toDateString()) {
    return "Yesterday";
  }

  return messageDate.toLocaleDateString([], {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
