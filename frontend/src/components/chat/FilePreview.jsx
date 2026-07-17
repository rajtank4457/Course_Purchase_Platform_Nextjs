"use client";

import { Box, Typography, IconButton } from "@mui/material";

import CloseRoundedIcon from "@mui/icons-material/Close";
import InsertDriveFileRoundedIcon from "@mui/icons-material/InsertDriveFile";

import { useChat } from "@/context/ChatContext";

export default function FilePreview() {
  const { selectedFile, setSelectedFile } = useChat();

  if (!selectedFile) return null;

  const isImage = selectedFile.type.startsWith("image");

  return (
    <Box
      sx={{
        p: 2,
        borderTop: "1px solid #eee",
        display: "flex",
        alignItems: "center",
        gap: 2,
        bgcolor: "#fafafa",
      }}
    >
      {isImage ? (
        <img
          src={URL.createObjectURL(selectedFile)}
          alt=""
          style={{
            width: 70,
            height: 70,
            objectFit: "cover",
            borderRadius: 8,
          }}
        />
      ) : (
        <InsertDriveFileRoundedIcon
          sx={{
            fontSize: 50,
          }}
        />
      )}

      <Box flex={1}>
        <Typography fontWeight={600}>{selectedFile.name}</Typography>

        <Typography variant="caption" color="text.secondary">
          {(selectedFile.size / 1024).toFixed(1)} KB
        </Typography>
      </Box>

      <IconButton onClick={() => setSelectedFile(null)}>
        <CloseRoundedIcon />
      </IconButton>
    </Box>
  );
}
