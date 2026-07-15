"use client";

import { Stack, TextField, MenuItem } from "@mui/material";

export default function PlanToolbar({ search, setSearch }) {
  return (
    <Stack
      direction={{
        xs: "column",
        md: "row",
      }}
      spacing={2}
      mb={2}
    >
      <TextField
        fullWidth
        size="small"
        label="Search Plan"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <TextField
        size="small"
        select
        defaultValue="all"
        sx={{ minWidth: 180 }}
        label="Role"
      >
        <MenuItem value="all">All</MenuItem>

        <MenuItem value="both">Both</MenuItem>

        <MenuItem value="student">Student</MenuItem>

        <MenuItem value="faculty">Faculty</MenuItem>
      </TextField>

      <TextField
        size="small"
        select
        defaultValue="price"
        sx={{ minWidth: 180 }}
        label="Sort"
      >
        <MenuItem value="price">Price</MenuItem>

        <MenuItem value="name">Name</MenuItem>

        <MenuItem value="duration">Duration</MenuItem>
      </TextField>
    </Stack>
  );
}
