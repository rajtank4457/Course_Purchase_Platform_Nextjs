"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, facultyApi } from "@/lib/apiHelper";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  tableCellClasses,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { styled } from "@mui/material/styles";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BadgeIcon from "@mui/icons-material/Badge";
import SwapVertIcon from "@mui/icons-material/SwapVert";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#6d28d9",
    color: theme.palette.common.white,
    fontWeight: 800,
    fontSize: 13,
    padding: "12px 14px",
    whiteSpace: "nowrap",
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 13,
    padding: "10px 14px",
    wordBreak: "break-word",
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

function InfoItem({ icon, label, value }) {
  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "flex-start",
        gap: 1.2,
        bgcolor: "#f8fafc",
        borderRadius: 2,
        px: 1.5,
        py: 1,
      }}
    >
      <Box sx={{ color: "#64748b", mt: "2px", display: "flex" }}>{icon}</Box>
      <Typography
        variant="body2"
        sx={{ color: "#475569", wordBreak: "break-word" }}
      >
        <b style={{ color: "#0f172a" }}>{label}: </b>
        {value || "N/A"}
      </Typography>
    </Box>
  );
}

export default function FacultyClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);
  const [selectedFaculty, setSelectedFaculty] = useState(null);
  const [open, setOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "id");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("order") || "desc",
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const statusMap = {
    active: "1",
    inactive: "0",
  };

  const updateQuery = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all" || value === "none") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const fetchFaculty = async () => {
    const res = await apiRequest(facultyApi.getFaculty, {
      method: "GET",
    });

    if (!res.success) {
      alert(res.message || "Failed to fetch faculty");
      return;
    }

    const data = res.data?.data || [];

    const formatted = data.map((item) => ({
      adminId: item.adminId,
      adminName: item.adminName,
      gender: item.gender,
      phNo: item.phNo,
      email: item.email,
      roleId: item.roleId,
      isActive: Number(item.isActive),
    }));

    setRows(formatted);
    setPage(0);
  };

  useEffect(() => {
    fetchFaculty();
  }, []);

  const handleEdit = (row) => {
    setSelectedFaculty({
      ...row,
      isActive: Number(row.isActive),
    });

    setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSelectedFaculty((prev) => ({
      ...prev,
      [name]: name === "isActive" ? Number(value) : value,
    }));
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete Faculty ${row.adminName}?`)) return;

    try {
      const res = await apiRequest(facultyApi.deleteFaculty, {
        method: "POST",
        data: {
          adminId: row.adminId,
        },
      });

      if (!res.success) {
        alert(res.message || "Delete failed");
        return;
      }

      alert(res.message || "Faculty deleted successfully");

      setRows((prev) => prev.filter((item) => item.adminId !== row.adminId));
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Delete failed");
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        adminId: selectedFaculty.adminId,
        adminName: selectedFaculty.adminName,
        gender: selectedFaculty.gender,
        phNo: selectedFaculty.phNo,
        email: selectedFaculty.email,
        roleId: selectedFaculty.roleId,
        isActive: selectedFaculty.isActive,
      };

      const res = await apiRequest(facultyApi.updateFaculty, {
        method: "POST",
        data: payload,
      });

      if (!res.success) {
        alert(res.message || "Update failed");
        return;
      }

      alert(res.message || "Faculty updated successfully");

      setOpen(false);
      fetchFaculty();
    } catch (error) {
      console.error(error);
      alert("Update failed");
    }
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(0);
    updateQuery("status", value);
  };

  const handleSortByChange = (value) => {
    setSortBy(value);
    setPage(0);
    updateQuery("sortBy", value);
  };

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";

    setSortBy("id");
    setSortOrder(newOrder);
    setPage(0);

    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", "id");
    params.set("order", newOrder);

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const filteredRows = rows.filter(
    (row) =>
      statusFilter === "all" ||
      String(row.isActive) === statusMap[statusFilter],
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "id") {
      return sortOrder === "asc"
        ? Number(a.adminId) - Number(b.adminId)
        : Number(b.adminId) - Number(a.adminId);
    }

    if (sortBy === "name") {
      return sortOrder === "asc"
        ? String(a.adminName || "").localeCompare(String(b.adminName || ""))
        : String(b.adminName || "").localeCompare(String(a.adminName || ""));
    }

    return Number(b.adminId) - Number(a.adminId);
  });

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const currentUser = JSON.parse(localStorage.getItem("currentUser"));

  const canManageFaculty =
    currentUser?.role === "super_admin" ||
    (currentUser?.role === "admin" && currentUser?.isOwner === 1);

  return (
    <Box
      className="min-h-screen"
      sx={{
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        p: { xs: 1.5, sm: 2.5 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 2 }}>
        <Typography
          sx={{
            fontSize: { xs: 26, sm: 34 },
            fontWeight: 900,
            color: "#111827",
          }}
        >
          Faculty
        </Typography>

        <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
          Manage faculty users, status and role access
        </Typography>
      </Box>

      {/* Stats + Filters */}
      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: canManageFaculty ? "170px 170px 1fr" : "170px 170px 1fr",
          },
          gap: 1,
          alignItems: "stretch",
        }}
      >
        <StatBox label="Total Faculty" value={rows.length} color="#6d28d9" />

        <StatBox
          label="Active"
          value={rows.filter((x) => x.isActive === 1).length}
          color="#16a34a"
        />

        <Paper
          elevation={0}
          sx={{
            p: 1.25,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              flexWrap: "wrap",
            }}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "text.secondary",
              }}
            >
              Filters
            </Typography>

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              sx={{
                minWidth: 170,
                "& .MuiInputBase-root": {
                  height: 36,
                },
              }}
            >
              <MenuItem value="all">All Faculty</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>

            <TextField
              select
              size="small"
              value={sortBy}
              onChange={(e) => handleSortByChange(e.target.value)}
              sx={{
                minWidth: 170,
                "& .MuiInputBase-root": {
                  height: 36,
                },
              }}
            >
              <MenuItem value="id">Faculty ID</MenuItem>
              <MenuItem value="name">Faculty Name</MenuItem>
            </TextField>
          </Box>

          {canManageFaculty && (
            <Button
              variant="contained"
              onClick={() => router.push("/admin/add-faculty")}
              sx={{
                bgcolor: "#6d28d9",
                textTransform: "none",
                fontWeight: 600,
                borderRadius: 2,
                px: 2,
                "&:hover": {
                  bgcolor: "#5b21b6",
                },
              }}
            >
              + Add Faculty
            </Button>
          )}
        </Paper>
      </Box>

      {isMobile ? (
        <Box>
          {paginatedRows.map((row) => (
            <Card key={row.adminId} sx={{ mb: 1.5, borderRadius: 4 }}>
              <Box
                sx={{
                  p: 2,
                  background: "linear-gradient(135deg,#6d28d9,#9333ea)",
                  color: "white",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <PersonIcon />
                    <Box>
                      <Typography fontWeight={900}>{row.adminName}</Typography>
                      <Typography fontSize={12}>ID: {row.adminId}</Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={row.isActive === 1 ? "Active" : "Inactive"}
                    color={row.isActive === 1 ? "success" : "error"}
                    size="small"
                  />
                </Box>
              </Box>

              <CardContent>
                <Stack spacing={1}>
                  <InfoItem
                    icon={<EmailIcon fontSize="small" />}
                    label="Email"
                    value={row.email}
                  />
                  <InfoItem
                    icon={<PhoneIcon fontSize="small" />}
                    label="Phone"
                    value={row.phNo}
                  />
                  <InfoItem
                    icon={<BadgeIcon fontSize="small" />}
                    label="Gender"
                    value={row.gender}
                  />
                  {canManageFaculty && (
                    <Box sx={{ display: "flex", gap: 1, pt: 1 }}>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(row)}
                      >
                        Edit
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        color="error"
                        startIcon={<DeleteIcon />}
                        onClick={() => handleDelete(row)}
                      >
                        Delete
                      </Button>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{ borderRadius: 5, overflow: "hidden" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <StyledTableCell>
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      cursor: "pointer",
                    }}
                    onClick={toggleSortOrder}
                  >
                    ID <SwapVertIcon fontSize="small" />
                  </Box>
                </StyledTableCell>
                <StyledTableCell>Name</StyledTableCell>
                <StyledTableCell>Email</StyledTableCell>
                <StyledTableCell>Phone</StyledTableCell>
                <StyledTableCell>Gender</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedRows.map((row) => (
                <StyledTableRow key={row.adminId}>
                  <StyledTableCell>#{row.adminId}</StyledTableCell>
                  <StyledTableCell>
                    <b>{row.adminName}</b>
                  </StyledTableCell>
                  <StyledTableCell>{row.email}</StyledTableCell>
                  <StyledTableCell>{row.phNo || "N/A"}</StyledTableCell>
                  <StyledTableCell>{row.gender || "N/A"}</StyledTableCell>
                  <StyledTableCell>
                    <Chip
                      label={row.isActive === 1 ? "Active" : "Inactive"}
                      color={row.isActive === 1 ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </StyledTableCell>
                  {canManageFaculty && (
                    <StyledTableCell align="center">
                      <IconButton
                        sx={{ color: "#7e22ce" }}
                        onClick={() => handleEdit(row)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDelete(row)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </StyledTableCell>
                  )}
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ bgcolor: "white", borderRadius: 4, mt: 1.5 }}>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={filteredRows.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
        />
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Faculty</DialogTitle>

        <DialogContent>
          <TextField
            margin="dense"
            fullWidth
            label="Faculty Name"
            name="adminName"
            value={selectedFaculty?.adminName || ""}
            onChange={handleChange}
          />

          <TextField
            margin="dense"
            fullWidth
            label="Email"
            name="email"
            value={selectedFaculty?.email || ""}
            onChange={handleChange}
          />

          <TextField
            margin="dense"
            fullWidth
            label="Phone"
            name="phNo"
            value={selectedFaculty?.phNo || ""}
            onChange={handleChange}
          />

          <TextField
            margin="dense"
            fullWidth
            label="Gender"
            name="gender"
            value={selectedFaculty?.gender || ""}
            onChange={handleChange}
          />

          <TextField
            margin="dense"
            fullWidth
            label="Role ID"
            name="roleId"
            value={selectedFaculty?.roleId || ""}
            onChange={handleChange}
            disabled
          />

          <FormControl fullWidth margin="dense">
            <InputLabel>Status</InputLabel>

            <Select
              name="isActive"
              label="Status"
              value={selectedFaculty?.isActive ?? 0}
              onChange={handleChange}
            >
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>

          <Button variant="contained" onClick={handleSave}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

function StatBox({ label, value, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 1.25,
        borderRadius: 3,
        border: "1px solid",
        borderColor: "#e5e7eb",
        boxShadow: "0 4px 12px rgba(15,23,42,0.04)",
        minHeight: 72,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Typography
        sx={{
          fontSize: 12,
          color: "#6b7280",
          fontWeight: 600,
        }}
      >
        {label}
      </Typography>

      <Typography
        sx={{
          fontSize: 24,
          fontWeight: 800,
          color,
          lineHeight: 1.1,
          mt: 0.25,
        }}
      >
        {value}
      </Typography>
    </Paper>
  );
}
