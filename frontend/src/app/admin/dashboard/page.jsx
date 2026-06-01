"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";

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
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import BusinessIcon from "@mui/icons-material/Business";
import WcIcon from "@mui/icons-material/Wc";
import SwapVertIcon from "@mui/icons-material/SwapVert";

import API_URL from "@/config/api";

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: "#6d28d9",
    color: theme.palette.common.white,
    fontWeight: 700,
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
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
        sx={{
          color: "#475569",
          wordBreak: "break-word",
          lineHeight: 1.5,
        }}
      >
        <b style={{ color: "#0f172a" }}>{label}: </b>
        {value || "N/A"}
      </Typography>
    </Box>
  );
}

export default function AdminDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);
  const [view, setView] = useState("students");

  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState(
    searchParams.get("status") || "all",
  );

  const [studentSortBy, setStudentSortBy] = useState(
    searchParams.get("sortBy") || "id",
  );

  const [studentSortOrder, setStudentSortOrder] = useState(
    searchParams.get("order") || "asc",
  );

  const [adminSortOrder, setAdminSortOrder] = useState("asc");

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

    router.replace(`?${params.toString()}`);
  };

  const handleStatusChange = (value) => {
    setStatusFilter(value);
    setPage(0);
    updateQuery("status", value);
  };

  const handleSortByChange = (value) => {
    setStudentSortBy(value);
    setPage(0);
    updateQuery("sortBy", value);
  };

  const toggleStudentSortOrder = () => {
    const newOrder = studentSortOrder === "asc" ? "desc" : "asc";

    setStudentSortBy("id");
    setStudentSortOrder(newOrder);
    setPage(0);

    const params = new URLSearchParams(searchParams.toString());
    params.set("sortBy", "id");
    params.set("order", newOrder);

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleChangePage = (_, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (e) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
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
    const isStudent = view === "students";

    const idField = isStudent ? "userId" : "adminId";
    const displayIdField = isStudent ? "StdId" : "AdminId";
    const nameField = isStudent ? "StdName" : "AdminName";

    const confirmDelete = window.confirm(
      `Delete ${isStudent ? "Student" : "Admin"} ${row[nameField]}?`,
    );

    if (!confirmDelete) return;

    try {
      const url = isStudent
        ? `${API_URL}/auth/delete-student`
        : `${API_URL}/auth/delete-admin`;

      const res = await axios.post(
        url,
        {
          [idField]: row[idField] || row[displayIdField],
        },
        {
          withCredentials: true,
        },
      );

      if (res.data.success) {
        alert(
          isStudent
            ? "Student deleted successfully"
            : "Admin deleted successfully",
        );

        setRows((prev) =>
          prev.filter((item) => item[displayIdField] !== row[displayIdField]),
        );
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
      const url =
        view === "students"
          ? `${API_URL}/auth/update-student`
          : `${API_URL}/auth/update-admin`;

      const res = await axios.post(url, selectedUser, {
        withCredentials: true,
      });

      if (res.data.success) {
        alert(
          view === "students"
            ? "Student updated successfully"
            : "Admin updated successfully",
        );

        setRows((prev) =>
          prev.map((item) =>
            view === "students"
              ? item.StdId === selectedUser.StdId
                ? { ...item, ...selectedUser }
                : item
              : item.AdminId === selectedUser.AdminId
                ? { ...item, ...selectedUser }
                : item,
          ),
        );

        setOpen(false);
      } else {
        alert(res.data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Update request failed");
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const url =
          view === "students"
            ? `${API_URL}/auth/user_details`
            : `${API_URL}/auth/admins`;

        const res = await axios.get(url, {
          withCredentials: true,
        });

        const formattedData = res.data.map((user) => {
          // STUDENT DATA
          if (view === "students") {
            return {
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
            };
          }

          // ADMIN DATA
          return {
            adminId: user.adminId,
            adminName: user.adminName,
            gender: user.gender,
            phNo: user.phNo,
            email: user.email,
            role: user.role,
            isActive: Number(user.isActive),

            AdminId: user.adminId,
            AdminName: user.adminName,
            Pass: user.password,
            Email: user.email,
            PhNo: user.phNo,
            Gender: user.gender,
            Role: user.role,
          };
        });

        setRows(formattedData);
        setPage(0);
      } catch (error) {
        console.error(error);
      }
    };

    fetchData();
  }, [view]);

  const filteredRows = rows.filter((row) => {
    return (
      statusFilter === "all" || String(row.isActive) === statusMap[statusFilter]
    );
  });

  const validRows = filteredRows.filter((row) =>
    view === "students" ? row.StdId : row.AdminId,
  );

  const sortedRows = [...validRows].sort((a, b) => {
    if (view === "students") {
      if (studentSortBy === "id") {
        return studentSortOrder === "asc"
          ? Number(a.StdId) - Number(b.StdId)
          : Number(b.StdId) - Number(a.StdId);
      }

      if (studentSortBy === "name") {
        return studentSortOrder === "asc"
          ? String(a.StdName || "").localeCompare(String(b.StdName || ""))
          : String(b.StdName || "").localeCompare(String(a.StdName || ""));
      }

      if (studentSortBy === "dob") {
        const dateA = new Date(a.DOB || 0);
        const dateB = new Date(b.DOB || 0);

        return studentSortOrder === "asc" ? dateA - dateB : dateB - dateA;
      }

      return Number(a.StdId) - Number(b.StdId);
    }

    return adminSortOrder === "asc"
      ? Number(a.AdminId) - Number(b.AdminId)
      : Number(b.AdminId) - Number(a.AdminId);
  });

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Box
      className="min-h-screen flex flex-col"
      sx={{
        background: "#f8fafc",
      }}
    >
      <Box sx={{ flex: 1, p: { xs: 1.5, sm: 3 } }}>
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 4,
            p: { xs: 2, sm: 3 },
            mb: 3,
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
            border: "1px solid #ede9fe",
            maxWidth: 850,
            mx: "auto",
          }}
        >
          <Typography
            sx={{
              fontSize: { xs: 24, sm: 32 },
              fontWeight: 700,
              textAlign: "center",
              color: "#6d28d9",
            }}
          >
            {view === "students" ? "Student List" : "Admin List"}
          </Typography>

          <Box
            sx={{
              mt: 2.5,
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 1,
              bgcolor: "#f5f3ff",
              borderRadius: 4,
              p: 0.5,
            }}
          >
            <Button
              onClick={() => {
                setView("students");
                setStatusFilter("all");
                setPage(0);
              }}
              sx={{
                borderRadius: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: view === "students" ? "#6d28d9" : "transparent",
                color: view === "students" ? "white" : "#6d28d9",
              }}
            >
              Students
            </Button>

            <Button
              onClick={() => {
                setView("admins");
                setStatusFilter("all");
                setPage(0);
              }}
              sx={{
                borderRadius: 3,
                py: 1,
                textTransform: "none",
                fontWeight: 700,
                bgcolor: view === "admins" ? "#6d28d9" : "transparent",
                color: view === "admins" ? "white" : "#6d28d9",
              }}
            >
              Admins
            </Button>
          </Box>

          <Box
            sx={{
              mt: 2,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Button
              onClick={() => {
                if (view === "admins") {
                  router.push("/admin/add-admin");
                } else {
                  router.push("/admin/add-student");
                }
              }}
              sx={{
                borderRadius: 3,
                px: 3,
                py: 1.1,
                bgcolor: "#6d28d9",
                color: "white",
                textTransform: "none",
                fontWeight: 700,
                boxShadow: "0 8px 20px rgba(109,40,217,0.25)",
                "&:hover": {
                  bgcolor: "#5b21b6",
                },
              }}
            >
              {view === "admins" ? "+ Add New Admin" : "+ Add New Student"}
            </Button>
          </Box>

          <Box
            sx={{
              mt: 2,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: view === "students" ? "40px 1fr 1fr" : "40px 1fr",
              },
              gap: 1.2,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                display: { xs: "none", sm: "flex" },
                justifyContent: "center",
              }}
            >
              <FilterAltIcon sx={{ color: "#6d28d9" }} />
            </Box>

            <TextField
              select
              label="Status"
              value={statusFilter}
              onChange={(e) => handleStatusChange(e.target.value)}
              size="small"
              fullWidth
            >
              <MenuItem value="all">
                {view === "students" ? "All Students" : "All Admins"}
              </MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>

            {view === "students" && (
              <TextField
                select
                label="Sort By"
                value={studentSortBy}
                onChange={(e) => handleSortByChange(e.target.value)}
                size="small"
                fullWidth
              >
                <MenuItem value="none">None</MenuItem>
                {isMobile && <MenuItem value="id">Student ID</MenuItem>}
                <MenuItem value="name">Student Name</MenuItem>
                <MenuItem value="dob">DOB</MenuItem>
              </TextField>
            )}
          </Box>
        </Box>

        {isMobile ? (
          <Box>
            {paginatedRows.map((row) =>
              view === "students" ? (
                <Card
                  key={row.StdId}
                  sx={{ mb: 2, borderRadius: 4, overflow: "hidden" }}
                >
                  <Box
                    sx={{
                      background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                      color: "white",
                      p: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <PersonIcon />
                        </Box>

                        <Box>
                          <Typography fontWeight={800}>
                            {row.StdName}
                          </Typography>
                          <Typography fontSize={12}>
                            Student ID: {row.StdId}
                          </Typography>
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
                          row.DOB
                            ? new Date(row.DOB).toLocaleDateString()
                            : "N/A"
                        }
                      />

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
                    </Stack>
                  </CardContent>
                </Card>
              ) : (
                <Card
                  key={row.AdminId}
                  sx={{ mb: 2, borderRadius: 4, overflow: "hidden" }}
                >
                  <Box
                    sx={{
                      background: "linear-gradient(135deg,#4f46e5,#6d28d9)",
                      color: "white",
                      p: 2,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                      }}
                    >
                      <Box sx={{ display: "flex", gap: 1.5 }}>
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 3,
                            bgcolor: "rgba(255,255,255,0.15)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <AdminPanelSettingsIcon />
                        </Box>

                        <Box>
                          <Typography fontWeight={800}>
                            {row.AdminName}
                          </Typography>
                          <Typography fontSize={12}>
                            Admin ID: {row.AdminId}
                          </Typography>
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
                        value={row.Email}
                      />
                      <InfoItem
                        icon={<PhoneIcon fontSize="small" />}
                        label="Phone"
                        value={row.PhNo}
                      />
                      <InfoItem
                        icon={<WcIcon fontSize="small" />}
                        label="Gender"
                        value={row.Gender}
                      />
                      <InfoItem
                        icon={<BusinessIcon fontSize="small" />}
                        label="Role"
                        value={row.Role}
                      />

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
                    </Stack>
                  </CardContent>
                </Card>
              ),
            )}
          </Box>
        ) : (
          <TableContainer
            component={Paper}
            sx={{
              mt: 2,
              borderRadius: 4,
              overflow: "hidden",
              boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
              border: "1px solid #e5e7eb",
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
                      onClick={() => {
                        if (view === "students") {
                          toggleStudentSortOrder();
                        } else {
                          setAdminSortOrder((prev) =>
                            prev === "asc" ? "desc" : "asc",
                          );
                          setPage(0);
                        }
                      }}
                    >
                      {view === "students" ? "Student ID" : "Admin ID"}
                      <SwapVertIcon fontSize="small" />
                    </Box>
                  </StyledTableCell>

                  <StyledTableCell>
                    {view === "students" ? "Student Name" : "Admin Name"}
                  </StyledTableCell>
                  {view === "admins" && (
                    <StyledTableCell>Password</StyledTableCell>
                  )}
                  <StyledTableCell>Email</StyledTableCell>
                  <StyledTableCell>Phone</StyledTableCell>

                  {view === "students" ? (
                    <>
                      <StyledTableCell>Address</StyledTableCell>
                      <StyledTableCell>City</StyledTableCell>
                      <StyledTableCell>State</StyledTableCell>
                      <StyledTableCell>DOB</StyledTableCell>
                    </>
                  ) : (
                    <>
                      <StyledTableCell>Gender</StyledTableCell>
                      <StyledTableCell>Role</StyledTableCell>
                    </>
                  )}

                  <StyledTableCell>Status</StyledTableCell>
                  <StyledTableCell>Actions</StyledTableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {paginatedRows.map((row) => (
                  <StyledTableRow
                    key={view === "students" ? row.StdId : row.AdminId}
                  >
                    <StyledTableCell>
                      {view === "students" ? row.StdId : row.AdminId}
                    </StyledTableCell>
                    <StyledTableCell>
                      {view === "students" ? row.StdName : row.AdminName}
                    </StyledTableCell>
                    {view === "admins" && (
                      <StyledTableCell>
                        {row.Pass ? `${row.Pass.substring(0, 8)}...` : "N/A"}
                      </StyledTableCell>
                    )}
                    <StyledTableCell>{row.Email}</StyledTableCell>
                    <StyledTableCell>{row.PhNo}</StyledTableCell>

                    {view === "students" ? (
                      <>
                        <StyledTableCell>{row.Addr || "N/A"}</StyledTableCell>
                        <StyledTableCell>{row.City || "N/A"}</StyledTableCell>
                        <StyledTableCell>{row.State || "N/A"}</StyledTableCell>
                        <StyledTableCell>
                          {row.DOB
                            ? new Date(row.DOB).toLocaleDateString()
                            : "N/A"}
                        </StyledTableCell>
                      </>
                    ) : (
                      <>
                        <StyledTableCell>{row.Gender || "N/A"}</StyledTableCell>
                        <StyledTableCell>{row.Role || "N/A"}</StyledTableCell>
                      </>
                    )}

                    <StyledTableCell>
                      <Chip
                        label={row.isActive === 1 ? "Active" : "Inactive"}
                        color={row.isActive === 1 ? "success" : "error"}
                        size="small"
                      />
                    </StyledTableCell>

                    <StyledTableCell>
                      <IconButton
                        color="primary"
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
            mt: 2,
            boxShadow: "0 8px 24px rgba(79,70,229,0.10)",
          }}
        >
          <TablePagination
            rowsPerPageOptions={[5, 10, 25]}
            component="div"
            count={validRows.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangeRowsPerPage}
          />
        </Box>
      </Box>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Edit {view === "students" ? "Student" : "Admin"} Details
        </DialogTitle>

        <DialogContent>
          <TextField
            label="Name"
            name={view === "students" ? "StdName" : "adminName"}
            value={
              view === "students"
                ? selectedUser?.StdName || ""
                : selectedUser?.adminName || ""
            }
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
            name={view === "students" ? "phoneNo" : "phNo"}
            value={
              view === "students"
                ? selectedUser?.phoneNo || ""
                : selectedUser?.phNo || ""
            }
            onChange={handleChange}
            fullWidth
            margin="dense"
          />

          {view === "students" && (
            <>
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
                value={selectedUser?.DOB || ""}
                onChange={handleChange}
                fullWidth
                margin="dense"
                slotProps={{
                  inputLabel: {
                    shrink: true,
                  },
                }}
              />
            </>
          )}

          {view === "admins" && (
            <>
              <TextField
                label="Gender"
                name="gender"
                value={selectedUser?.gender || ""}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />

              <TextField
                label="Role"
                name="role"
                value={selectedUser?.role || ""}
                onChange={handleChange}
                fullWidth
                margin="dense"
              />
            </>
          )}

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
