"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
} from "@mui/material";

export default function DeleteDialog({ open, plan, onClose }) {
  const handleDelete = () => {
    // Later call API
    console.log("Delete", plan?.planId);

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete Plan</DialogTitle>

      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete <strong>{plan?.planName}</strong>?
        </DialogContentText>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button color="error" variant="contained" onClick={handleDelete}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
