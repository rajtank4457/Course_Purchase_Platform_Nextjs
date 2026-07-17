"use client";

import { useState, useRef } from "react";

import { Box, IconButton, InputAdornment, TextField } from "@mui/material";

import SendRoundedIcon from "@mui/icons-material/SendRounded";
import InsertEmoticonRoundedIcon from "@mui/icons-material/InsertEmoticonRounded";
import AttachFileRoundedIcon from "@mui/icons-material/AttachFileRounded";
import MicRoundedIcon from "@mui/icons-material/MicRounded";
import EmojiPicker from "emoji-picker-react";
import FilePreview from "./FilePreview";
import ReplyPreview from "./ReplyPreview";

import { useChat } from "@/context/ChatContext";
import { getSocket, connectSocket } from "@/lib/socket";
import { apiRequest, chatApi } from "@/lib/apiHelper";

export default function MessageInput() {
  const socket = getSocket() || connectSocket();
  const {
    selectedConversation,

    selectedFile,

    setSelectedFile,

    replyMessage,

    setReplyMessage,
  } = useChat();

  const [message, setMessage] = useState("");
  const [emojiOpen, setEmojiOpen] = useState(false);

  const typingTimeout = useRef(null);
  const fileInputRef = useRef();

  if (!selectedConversation) return null;

  const handleTyping = (value) => {
    setMessage(value);

    socket.emit("typing", {
      conversationId: selectedConversation.conversationId,
    });

    clearTimeout(typingTimeout.current);

    typingTimeout.current = setTimeout(() => {
      socket.emit("stopTyping", {
        conversationId: selectedConversation.conversationId,
      });
    }, 1200);
  };

  const sendMessage = async () => {
    if (!message && !selectedFile) {
      return;
    }

    socket.emit("stopTyping", {
      conversationId: selectedConversation.conversationId,
    });

    const formData = new FormData();

    formData.append("conversationId", selectedConversation.conversationId);

    formData.append("message", message);

    formData.append("messageType", selectedFile ? "file" : "text");

    if (selectedFile) {
      formData.append("file", selectedFile);
    }

    const res = await apiRequest(chatApi.sendMessage, {
      method: "POST",
      data: formData,
    });

    if (res.success) {
      setMessage("");

      setSelectedFile(null);

      fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();

      sendMessage();
    }
  };

  const onEmojiClick = (emojiData) => {
    setMessage((prev) => prev + emojiData.emoji);

    setEmojiOpen(false);
  };

  const handleFile = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    setSelectedFile(file);
  };

  return (
    <Box
      sx={{
        bgcolor: "#f0f2f5",
        borderTop: "1px solid #ddd",
        p: 1.5,
      }}
    >
      {selectedFile && (
        <Box mb={1}>
          <FilePreview
            file={selectedFile}
            onRemove={() => setSelectedFile(null)}
          />
        </Box>
      )}

      <input hidden type="file" ref={fileInputRef} onChange={handleFile} />

      <Box display="flex" alignItems="center" gap={1}>
        <Box position="relative">
          <IconButton onClick={() => setEmojiOpen((v) => !v)}>
            <InsertEmoticonRoundedIcon />
          </IconButton>

          {emojiOpen && (
            <Box
              sx={{
                position: "absolute",
                bottom: 55,
                left: 0,
                zIndex: 2000,
              }}
            >
              <EmojiPicker onEmojiClick={onEmojiClick} />
            </Box>
          )}
        </Box>

        <IconButton onClick={() => fileInputRef.current?.click()}>
          <AttachFileRoundedIcon />
        </IconButton>

        <ReplyPreview />

        <TextField
          fullWidth
          multiline
          maxRows={4}
          value={message}
          placeholder="Type a message..."
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          sx={{
            "& .MuiOutlinedInput-root": {
              borderRadius: "30px",
              bgcolor: "#fff",
            },
          }}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton>
                  <MicRoundedIcon />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <IconButton
          color="primary"
          onClick={sendMessage}
          sx={{
            width: 48,
            height: 48,
            bgcolor: "#1976d2",
            color: "#fff",
            "&:hover": {
              bgcolor: "#1565c0",
            },
          }}
        >
          <SendRoundedIcon />
        </IconButton>
      </Box>
    </Box>
  );
}
