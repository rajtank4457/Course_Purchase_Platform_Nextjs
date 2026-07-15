"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, studentApi } from "@/lib/apiHelper";
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
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import PersonIcon from "@mui/icons-material/Person";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BusinessIcon from "@mui/icons-material/Business";
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

export default function StudentsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "id");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("order") || "asc",
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

  const fetchStudents = async () => {
    try {
      const service = studentApi.getStudents;

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        console.log(res.message || "Failed to fetch students");
        return;
      }

      const formattedData = res.data.data.map((user) => ({
        userId: user.userId,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phoneNo: user.phoneNo,
        address: user.address,
        city: user.city,
        state: user.state,
        dob: user.dob,
        isActive: Number(user.isActive),

        StdId: user.userId,
        StdName: `${user.firstName} ${user.lastName}`,
        Email: user.email,
        PhNo: user.phoneNo,
        Addr: user.address,
        City: user.city,
        State: user.state,
        DOB: user.dob,
      }));

      setRows(formattedData);
      setPage(0);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

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

  const handleEdit = (row) => {
    setSelectedUser({
      ...row,
      isActive: Number(row.isActive),
    });
    setOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setSelectedUser((prev) => ({
      ...prev,
      [name]: name === "isActive" ? Number(value) : value,
    }));
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete Student ${row.StdName}?`)) return;

    try {
      const service = studentApi.deleteStudent;

      const req = {
        method: "POST",
        data: {
          userId: row.userId || row.StdId,
        },
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Delete failed");
        return;
      }

      if (res.data.success) {
        alert("Student deleted successfully");
        setRows((prev) => prev.filter((item) => item.StdId !== row.StdId));
      } else {
        alert(res.data.message || "Delete failed");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.message || "Delete request failed");
    }
  };

  const handleSave = async () => {
    try {
      const payload = {
        userId: selectedUser.userId || selectedUser.StdId,
        firstName: selectedUser.firstName,
        lastName: selectedUser.lastName,
        email: selectedUser.email,
        phoneNo: selectedUser.phoneNo,
        address: selectedUser.Addr,
        city: selectedUser.City,
        state: selectedUser.State,
        dob: selectedUser.DOB,
        isActive: selectedUser.isActive,
      };

      const service = studentApi.updateStudent;

      const req = {
        method: "POST",
        data: payload,
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Update failed");
        return;
      }

      alert(res.message || "Student updated successfully");

      setOpen(false);
      fetchStudents();
    } catch (error) {
      console.error(error);
      alert(error.message || "Update request failed");
    }
  };

  const filteredRows = rows.filter(
    (row) =>
      statusFilter === "all" ||
      String(row.isActive) === statusMap[statusFilter],
  );

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "id") {
      return sortOrder === "asc"
        ? Number(a.StdId) - Number(b.StdId)
        : Number(b.StdId) - Number(a.StdId);
    }

    if (sortBy === "name") {
      return sortOrder === "asc"
        ? String(a.StdName || "").localeCompare(String(b.StdName || ""))
        : String(b.StdName || "").localeCompare(String(a.StdName || ""));
    }

    if (sortBy === "dob") {
      const dateA = new Date(a.DOB || 0);
      const dateB = new Date(b.DOB || 0);
      return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
    }

    return Number(a.StdId) - Number(b.StdId);
  });

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

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
          Students
        </Typography>

        <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
          Manage student details, status and records
        </Typography>
      </Box>

      {/* Stats + Filters */}
      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: "170px 170px 1fr",
          },
          gap: 1,
          alignItems: "stretch",
        }}
      >
        <StatBox label="Total Students" value={rows.length} color="#6d28d9" />

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
          {/* Left */}
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
              <MenuItem value="all">All Students</MenuItem>
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
              <MenuItem value="id">Student ID</MenuItem>
              <MenuItem value="name">Student Name</MenuItem>
              <MenuItem value="dob">DOB</MenuItem>
            </TextField>
          </Box>

          {/* Right */}
          <Button
            variant="contained"
            onClick={() => router.push("/admin/add-student")}
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
            + Add Student
          </Button>
        </Paper>
      </Box>

      {/* Mobile Cards */}
      {isMobile ? (
        <Box>
          {paginatedRows.map((row) => (
            <Card
              key={row.StdId}
              sx={{
                mb: 1.5,
                borderRadius: 4,
                overflow: "hidden",
                boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
                border: "1px solid #e5e7eb",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  background: "linear-gradient(135deg,#6d28d9,#9333ea)",
                  color: "white",
                }}
              >
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
                    <Box
                      sx={{
                        height: 46,
                        width: 46,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <PersonIcon />
                    </Box>

                    <Box>
                      <Typography fontWeight={900}>{row.StdName}</Typography>
                      <Typography fontSize={12}>ID: {row.StdId}</Typography>
                    </Box>
                  </Box>

                  <Chip
                    label={row.isActive === 1 ? "Active" : "Inactive"}
                    color={row.isActive === 1 ? "success" : "error"}
                    size="small"
                  />
                </Box>
              </Box>

              <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
                <Stack spacing={1}>
                  <InfoItem
                    icon={<EmailIcon fontSize="small" />}
                    label="Email"
                    value={row.Email}
                  />
                  <InfoItem
                    icon={<PhoneIcon fontSize="small" />}
                    label="Phone"
                    value={row.PhNo}
                  />
                  <InfoItem
                    icon={<LocationOnIcon fontSize="small" />}
                    label="Address"
                    value={row.Addr}
                  />
                  <InfoItem
                    icon={<BusinessIcon fontSize="small" />}
                    label="City"
                    value={row.City}
                  />
                  <InfoItem
                    icon={<BusinessIcon fontSize="small" />}
                    label="State"
                    value={row.State}
                  />
                  <InfoItem
                    icon={<CalendarMonthIcon fontSize="small" />}
                    label="DOB"
                    value={
                      row.DOB ? new Date(row.DOB).toLocaleDateString() : "N/A"
                    }
                  />

                  <Box sx={{ display: "flex", gap: 1, pt: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(row)}
                      sx={{
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      fullWidth
                      variant="contained"
                      color="error"
                      startIcon={<DeleteIcon />}
                      onClick={() => handleDelete(row)}
                      sx={{
                        borderRadius: 3,
                        textTransform: "none",
                        fontWeight: 800,
                      }}
                    >
                      Delete
                    </Button>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <TableContainer
          component={Paper}
          sx={{
            borderRadius: 5,
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
          }}
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
                <StyledTableCell>City</StyledTableCell>
                <StyledTableCell>State</StyledTableCell>
                <StyledTableCell>DOB</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedRows.map((row) => (
                <StyledTableRow key={row.StdId}>
                  <StyledTableCell>
                    <button
                      type="button"
                      onClick={() =>
                        router.push(`/admin/students/${row.StdId}`)
                      }
                      className="font-black text-purple-700 hover:underline"
                    >
                      #{row.StdId}
                    </button>
                  </StyledTableCell>

                  <StyledTableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Box
                        sx={{
                          height: 36,
                          width: 36,
                          borderRadius: "50%",
                          bgcolor: "#ede9fe",
                          color: "#6d28d9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <PersonIcon fontSize="small" />
                      </Box>
                      <b>{row.StdName}</b>
                    </Box>
                  </StyledTableCell>

                  <StyledTableCell>{row.Email}</StyledTableCell>
                  <StyledTableCell>{row.PhNo}</StyledTableCell>
                  <StyledTableCell>{row.City || "N/A"}</StyledTableCell>
                  <StyledTableCell>{row.State || "N/A"}</StyledTableCell>
                  <StyledTableCell>
                    {row.DOB ? new Date(row.DOB).toLocaleDateString() : "N/A"}
                  </StyledTableCell>

                  <StyledTableCell>
                    <Chip
                      label={row.isActive === 1 ? "Active" : "Inactive"}
                      color={row.isActive === 1 ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </StyledTableCell>

                  <StyledTableCell align="center">
                    <IconButton
                      sx={{ color: "#7e22ce" }}
                      onClick={() => handleEdit(row)}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(row)}>
                      <DeleteIcon />
                    </IconButton>
                  </StyledTableCell>
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box
        sx={{
          bgcolor: "white",
          borderRadius: 4,
          mt: 1.5,
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        }}
      >
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

      {/* Dialog same as your current */}
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Student Details</DialogTitle>

        <DialogContent>
          <TextField
            label="First Name"
            name="firstName"
            value={selectedUser?.firstName || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Last Name"
            name="lastName"
            value={selectedUser?.lastName || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Email"
            name="email"
            value={selectedUser?.email || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Phone"
            name="phoneNo"
            value={selectedUser?.phoneNo || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Address"
            name="Addr"
            value={selectedUser?.Addr || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="City"
            name="City"
            value={selectedUser?.City || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="State"
            name="State"
            value={selectedUser?.State || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Date of Birth"
            name="DOB"
            type="date"
            value={
              selectedUser?.DOB ? String(selectedUser.DOB).split("T")[0] : ""
            }
            onChange={handleChange}
            fullWidth
            margin="dense"
            slotProps={{ inputLabel: { shrink: true } }}
          />

          <FormControl fullWidth margin="dense">
            <InputLabel>Active Status</InputLabel>
            <Select
              name="isActive"
              label="Active Status"
              value={selectedUser?.isActive ?? 0}
              onChange={handleChange}
            >
              <MenuItem value={1}>Active</MenuItem>
              <MenuItem value={0}>Inactive</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained">
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
