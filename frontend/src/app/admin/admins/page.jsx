"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
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
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import EmailIcon from "@mui/icons-material/Email";
import PhoneIcon from "@mui/icons-material/Phone";
import BusinessIcon from "@mui/icons-material/Business";
import WcIcon from "@mui/icons-material/Wc";
import SwapVertIcon from "@mui/icons-material/SwapVert";

import API_URL from "@/config/api";

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
        gap: 1,
        bgcolor: "#f8fafc",
        borderRadius: 2,
        px: 1.4,
        py: 0.8,
      }}
    >
      <Box sx={{ color: "#64748b", mt: "2px", display: "flex" }}>{icon}</Box>

      <Typography
        variant="body2"
        sx={{
          color: "#475569",
          wordBreak: "break-word",
          fontSize: 13,
        }}
      >
        <b style={{ color: "#0f172a" }}>{label}: </b>
        {value || "N/A"}
      </Typography>
    </Box>
  );
}

export default function AdminsPage() {
  const router = useRouter();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [open, setOpen] = useState(false);

  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOrder, setSortOrder] = useState("asc");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const statusMap = {
    active: "1",
    inactive: "0",
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/admins`, {
        withCredentials: true,
      });

      const formattedData = res.data.map((user) => ({
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
      }));

      setRows(formattedData);
      setPage(0);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

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
    if (!window.confirm(`Delete Admin ${row.AdminName}?`)) return;

    try {
      const res = await axios.post(
        `${API_URL}/admins/delete`,
        { adminId: row.adminId || row.AdminId },
        { withCredentials: true }
      );

      if (res.data.success) {
        alert("Admin deleted successfully");
        setRows((prev) => prev.filter((item) => item.AdminId !== row.AdminId));
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
        adminId: selectedUser.adminId || selectedUser.AdminId,
        adminName: selectedUser.adminName,
        gender: selectedUser.gender,
        phNo: selectedUser.phNo,
        email: selectedUser.email,
        isActive: selectedUser.isActive,
        role: selectedUser.role,
      };

      const res = await axios.post(`${API_URL}/admins/update`, payload, {
        withCredentials: true,
      });

      if (res.data.success) {
        alert("Admin updated successfully");
        setOpen(false);
        fetchAdmins();
      } else {
        alert(res.data.message || "Update failed");
      }
    } catch (error) {
      console.error(error);
      alert("Update request failed");
    }
  };

  const filteredRows = rows.filter(
    (row) =>
      statusFilter === "all" ||
      String(row.isActive) === statusMap[statusFilter]
  );

  const sortedRows = [...filteredRows].sort((a, b) =>
    sortOrder === "asc"
      ? Number(a.AdminId) - Number(b.AdminId)
      : Number(b.AdminId) - Number(a.AdminId)
  );

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const loggedInRole = localStorage.getItem("role");

  const canManageAdmin = (row) => {
    if (loggedInRole === "super_admin") return true;

    if (loggedInRole === "admin" && row.role === "admin") return true;

    return false;
  };

  return (
    <Box
      className="min-h-screen"
      sx={{
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        p: { xs: 1.5, sm: 2.5 },
      }}
    >
      <Box
        sx={{
          mb: 2,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 26, sm: 34 },
              fontWeight: 900,
              color: "#111827",
              lineHeight: 1.1,
            }}
          >
            Admins
          </Typography>

          <Typography sx={{ color: "#6b7280", fontSize: 14, mt: 0.5 }}>
            Manage administrators, roles, status, and access records
          </Typography>
        </Box>

        {localStorage.getItem("role") === "super_admin" && (
          <Button
            onClick={() => router.push("/admin/add-admin")}
            sx={{
              borderRadius: 999,
              px: 3,
              py: 1,
              bgcolor: "#6d28d9",
              color: "white",
              textTransform: "none",
              fontWeight: 800,
              boxShadow: "0 10px 25px rgba(109,40,217,0.25)",
              "&:hover": {
                bgcolor: "#5b21b6",
              },
            }}
          >
            + Add Admin
          </Button>
        )}
      </Box>

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "220px 220px 1fr",
          },
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 4,
            p: 2,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#6b7280", fontWeight: 700 }}>
            Total Admins
          </Typography>

          <Typography sx={{ fontSize: 30, fontWeight: 900, color: "#6d28d9" }}>
            {rows.length}
          </Typography>
        </Box>

        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 4,
            p: 2,
            border: "1px solid #e5e7eb",
            boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
          }}
        >
          <Typography sx={{ fontSize: 13, color: "#6b7280", fontWeight: 700 }}>
            Active Admins
          </Typography>

          <Typography sx={{ fontSize: 30, fontWeight: 900, color: "#16a34a" }}>
            {rows.filter((item) => item.isActive === 1).length}
          </Typography>
        </Box>

        <TextField
          select
          label="Status"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(0);
          }}
          size="small"
          fullWidth
          sx={{
            bgcolor: "white",
            borderRadius: 3,
          }}
        >
          <MenuItem value="all">All Admins</MenuItem>
          <MenuItem value="active">Active</MenuItem>
          <MenuItem value="inactive">Inactive</MenuItem>
        </TextField>
      </Box>

      {isMobile ? (
        <Box>
          {paginatedRows.map((row) => (
            <Card
              key={row.AdminId}
              sx={{
                mb: 1.5,
                borderRadius: 4,
                overflow: "hidden",
                border: "1px solid #e5e7eb",
                boxShadow: "0 10px 25px rgba(15,23,42,0.08)",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  background: "linear-gradient(135deg,#4f46e5,#7c3aed)",
                  color: "white",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      gap: 1.5,
                      alignItems: "center",
                    }}
                  >
                    <Box
                      sx={{
                        width: 46,
                        height: 46,
                        borderRadius: "50%",
                        bgcolor: "rgba(255,255,255,0.18)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <AdminPanelSettingsIcon />
                    </Box>

                    <Box>
                      <Typography fontWeight={900}>{row.AdminName}</Typography>

                      <Typography fontSize={12}>ID: {row.AdminId}</Typography>
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
                    onClick={() => {
                      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
                      setPage(0);
                    }}
                  >
                    ID <SwapVertIcon fontSize="small" />
                  </Box>
                </StyledTableCell>

                <StyledTableCell>Admin Name</StyledTableCell>
                <StyledTableCell>Password</StyledTableCell>
                <StyledTableCell>Email</StyledTableCell>
                <StyledTableCell>Phone</StyledTableCell>
                <StyledTableCell>Gender</StyledTableCell>
                <StyledTableCell>Role</StyledTableCell>
                <StyledTableCell>Status</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedRows.map((row) => (
                <StyledTableRow key={row.AdminId}>
                  <StyledTableCell>
                    <b>#{row.AdminId}</b>
                  </StyledTableCell>

                  <StyledTableCell>
                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 36,
                          height: 36,
                          borderRadius: "50%",
                          bgcolor: "#ede9fe",
                          color: "#6d28d9",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <AdminPanelSettingsIcon fontSize="small" />
                      </Box>

                      <b>{row.AdminName}</b>
                    </Box>
                  </StyledTableCell>

                  <StyledTableCell>
                    {row.Pass ? `${row.Pass.substring(0, 8)}...` : "N/A"}
                  </StyledTableCell>

                  <StyledTableCell>{row.Email}</StyledTableCell>

                  <StyledTableCell>{row.PhNo}</StyledTableCell>

                  <StyledTableCell>{row.Gender || "N/A"}</StyledTableCell>

                  <StyledTableCell>{row.Role || "N/A"}</StyledTableCell>

                  <StyledTableCell>
                    <Chip
                      label={row.isActive === 1 ? "Active" : "Inactive"}
                      color={row.isActive === 1 ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </StyledTableCell>

                  <StyledTableCell align="center">
                    {canManageAdmin(row) && (
                      <>
                        <IconButton color="primary" onClick={() => handleEdit(row)}>
                          <EditIcon />
                        </IconButton>

                        <IconButton color="error" onClick={() => handleDelete(row)}>
                          <DeleteIcon />
                        </IconButton>
                      </>
                    )}
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

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Edit Admin Details</DialogTitle>

        <DialogContent>
          <TextField
            label="Admin Name"
            name="adminName"
            value={selectedUser?.adminName || ""}
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
            name="phNo"
            value={selectedUser?.phNo || ""}
            onChange={handleChange}
            fullWidth
            margin="dense"
          />

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