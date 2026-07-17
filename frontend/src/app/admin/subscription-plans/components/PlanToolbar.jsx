"use client";

import { Stack, TextField, MenuItem } from "@mui/material";

export default function PlanToolbar({
  search,
  setSearch,
  roleFilter,
  setRoleFilter,
  sortBy,
  setSortBy,
}) {
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
        select
        size="small"
        label="Target Role"
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="all">All</MenuItem>

        <MenuItem value="both">Both</MenuItem>

        <MenuItem value="student">Student</MenuItem>

        <MenuItem value="faculty">Faculty</MenuItem>
      </TextField>

      <TextField
        select
        size="small"
        label="Sort By"
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        sx={{ minWidth: 180 }}
      >
        <MenuItem value="latest">Latest</MenuItem>

        <MenuItem value="priceLow">Price : Low → High</MenuItem>

        <MenuItem value="priceHigh">Price : High → Low</MenuItem>

        <MenuItem value="name">Plan Name</MenuItem>

        <MenuItem value="duration">Duration</MenuItem>
      </TextField>
    </Stack>
  );
}
