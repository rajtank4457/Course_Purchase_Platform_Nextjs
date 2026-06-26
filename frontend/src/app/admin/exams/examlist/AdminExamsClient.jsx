"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiRequest, examApi } from "@/lib/apiHelper";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  IconButton,
  MenuItem,
  Paper,
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
import { Plus } from "lucide-react";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import QuizIcon from "@mui/icons-material/Quiz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import SchoolIcon from "@mui/icons-material/School";
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
        gap: 1.2,
        bgcolor: "#f8fafc",
        borderRadius: 2,
        px: 1.5,
        py: 1,
      }}
    >
      <Box sx={{ color: "#64748b" }}>{icon}</Box>
      <Typography variant="body2" sx={{ color: "#475569" }}>
        <b style={{ color: "#0f172a" }}>{label}: </b>
        {value || "N/A"}
      </Typography>
    </Box>
  );
}

export default function AdminExamsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const [rows, setRows] = useState([]);

  const [typeFilter, setTypeFilter] = useState(
    searchParams.get("type") || "all",
  );
  const [publishFilter, setPublishFilter] = useState(
    searchParams.get("published") || "all",
  );
  const [sortBy, setSortBy] = useState(searchParams.get("sortBy") || "id");
  const [sortOrder, setSortOrder] = useState(
    searchParams.get("order") || "desc",
  );

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);

  const updateQuery = (key, value) => {
    const params = new URLSearchParams(searchParams.toString());

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const fetchExams = async () => {
    try {
      const service = examApi.getAllExams;

      const req = {
        method: "GET",
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        console.log("FETCH EXAMS ERROR:", res.message);
        return;
      }

      const list = res.data?.data || res.data || [];

      setRows(
        list.map((exam) => ({
          examId: exam.examId,
          courseId: exam.courseId,
          chId: exam.chId,
          examType: exam.examType,
          examTitle: exam.examTitle,
          examDesc: exam.examDesc,
          durationMinutes: exam.durationMinutes,
          totalMarks: exam.totalMarks,
          passingMarks: exam.passingMarks,
          maxAttempts: exam.maxAttempts,
          accessType: exam.accessType,
          requireCompletion: exam.requireCompletion,
          completionPercent: exam.completionPercent,
          isPublished: Number(exam.isPublished),
          isActive: Number(exam.isActive),
          createdAt: exam.createdAt,
          updatedAt: exam.updatedAt,
        })),
      );

      setPage(0);
    } catch (err) {
      console.log("FETCH EXAMS ERROR:", err);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  const handleDelete = async (row) => {
    if (!window.confirm(`Delete exam "${row.examTitle}"?`)) return;

    try {
      const service = examApi.deleteExam;

      const req = {
        method: "POST",
        data: {
          examId: row.examId,
        },
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        alert(res.message || "Delete failed");
        return;
      }

      alert(res.data?.message || "Exam deleted successfully");

      setRows((prev) => prev.filter((item) => item.examId !== row.examId));
    } catch (err) {
      alert("Delete request failed");
    }
  };

  const filteredRows = rows.filter((row) => {
    const typeOk = typeFilter === "all" || row.examType === typeFilter;
    const publishOk =
      publishFilter === "all" ||
      String(row.isPublished) === String(publishFilter);

    return typeOk && publishOk;
  });

  const sortedRows = [...filteredRows].sort((a, b) => {
    if (sortBy === "id") {
      return sortOrder === "asc"
        ? Number(a.examId) - Number(b.examId)
        : Number(b.examId) - Number(a.examId);
    }

    if (sortBy === "title") {
      return sortOrder === "asc"
        ? String(a.examTitle || "").localeCompare(String(b.examTitle || ""))
        : String(b.examTitle || "").localeCompare(String(a.examTitle || ""));
    }

    if (sortBy === "marks") {
      return sortOrder === "asc"
        ? Number(a.totalMarks) - Number(b.totalMarks)
        : Number(b.totalMarks) - Number(a.totalMarks);
    }

    return Number(b.examId) - Number(a.examId);
  });

  const paginatedRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  const toggleSortOrder = () => {
    const newOrder = sortOrder === "asc" ? "desc" : "asc";
    setSortOrder(newOrder);

    const params = new URLSearchParams(searchParams.toString());
    params.set("order", newOrder);
    params.set("sortBy", sortBy);

    router.replace(`?${params.toString()}`, { scroll: false });
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
          gap: 1.5,
        }}
      >
        <Box>
          <Typography
            sx={{
              fontSize: { xs: 26, sm: 34 },
              fontWeight: 900,
              color: "#111827",
            }}
          >
            Exams
          </Typography>
          <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
            Manage course tests, chapter tests, marks, duration and publish
            status
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Button
            onClick={() => router.push("/admin/exams/pending-check")}
            sx={{
              height: 34,
              px: 1.75,
              borderRadius: "8px",
              mt: "35px",
              bgcolor: "#6d28d9",
              color: "#fff",
              textTransform: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#5b21b6",
                opacity: 0.95,
                boxShadow: "none",
              },
            }}
          >
            See Pending Checks
          </Button>
          <Button
            onClick={() => router.push("/admin/exams/create")}
            startIcon={<Plus size={14} />}
            sx={{
              height: 34,
              px: 1.75,
              borderRadius: "8px",
              mt: "35px",
              bgcolor: "#6d28d9",
              color: "#fff",
              textTransform: "none",
              fontSize: "12.5px",
              fontWeight: 600,
              boxShadow: "none",
              "&:hover": {
                bgcolor: "#5b21b6",
                opacity: 0.95,
                boxShadow: "none",
              },
            }}
          >
            Create Exam
          </Button>
        </Box>
      </Box>

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "180px 180px 1fr",
          },
          gap: 1.5,
        }}
      >
        <StatBox label="Total Exams" value={rows.length} color="#6d28d9" />

        <StatBox
          label="Published"
          value={rows.filter((x) => x.isPublished === 1).length}
          color="#16a34a"
        />

        <Paper
          elevation={0}
          sx={{
            p: 2,
            borderRadius: 3,
            border: "1px solid",
            borderColor: "divider",
            bgcolor: "white",
          }}
        >
          <Typography
            variant="subtitle2"
            sx={{ mb: 1.5, fontWeight: 700, color: "text.secondary" }}
          >
            Filters
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              select
              label="Exam Type"
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                updateQuery("type", e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
            >
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="course">Course Test</MenuItem>
              <MenuItem value="chapter">Chapter Test</MenuItem>
            </TextField>

            <TextField
              select
              label="Publish Status"
              value={publishFilter}
              onChange={(e) => {
                setPublishFilter(e.target.value);
                updateQuery("published", e.target.value);
                setPage(0);
              }}
              size="small"
              fullWidth
            >
              <MenuItem value="all">All</MenuItem>
              <MenuItem value="1">Published</MenuItem>
              <MenuItem value="0">Draft</MenuItem>
            </TextField>
          </Box>
        </Paper>
      </Box>

      {isMobile ? (
        <Box>
          {paginatedRows.map((row) => (
            <Card
              key={row.examId}
              sx={{ mb: 1.5, borderRadius: 4, overflow: "hidden" }}
            >
              <Box
                sx={{
                  p: 2,
                  background: "linear-gradient(135deg,#6d28d9,#9333ea)",
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
                  <Box>
                    <Typography fontWeight={900}>{row.examTitle}</Typography>
                    <Typography fontSize={12}>Exam ID: {row.examId}</Typography>
                  </Box>

                  <Chip
                    label={row.isPublished === 1 ? "Published" : "Draft"}
                    color={row.isPublished === 1 ? "success" : "warning"}
                    size="small"
                  />
                </Box>
              </Box>

              <CardContent>
                <Stack spacing={1}>
                  <InfoItem
                    icon={<QuizIcon fontSize="small" />}
                    label="Type"
                    value={row.examType}
                  />
                  <InfoItem
                    icon={<SchoolIcon fontSize="small" />}
                    label="Course ID"
                    value={row.courseId}
                  />
                  <InfoItem
                    icon={<AccessTimeIcon fontSize="small" />}
                    label="Duration"
                    value={`${row.durationMinutes} mins`}
                  />
                  <InfoItem
                    icon={<CheckCircleIcon fontSize="small" />}
                    label="Marks"
                    value={`${row.totalMarks} / Pass ${row.passingMarks}`}
                  />

                  <Box sx={{ display: "flex", gap: 1, pt: 1 }}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<EditIcon />}
                      onClick={() =>
                        router.push(`/admin/exams/edit/${row.examId}`)
                      }
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
                <StyledTableCell>Title</StyledTableCell>
                <StyledTableCell>Type</StyledTableCell>
                <StyledTableCell>Course</StyledTableCell>
                <StyledTableCell>Chapter</StyledTableCell>
                <StyledTableCell>Duration</StyledTableCell>
                <StyledTableCell>Total</StyledTableCell>
                <StyledTableCell>Passing</StyledTableCell>
                <StyledTableCell>Attempts</StyledTableCell>
                <StyledTableCell>Access</StyledTableCell>
                <StyledTableCell>Published</StyledTableCell>
                <StyledTableCell>Active</StyledTableCell>
                <StyledTableCell align="center">Actions</StyledTableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedRows.map((row) => (
                <StyledTableRow key={row.examId}>
                  <StyledTableCell>
                    <button
                      type="button"
                      onClick={() => router.push(`/admin/exams/${row.examId}`)}
                      className="font-black text-purple-700 hover:underline"
                    >
                      #{row.examId}
                    </button>
                  </StyledTableCell>

                  <StyledTableCell>
                    <b>{row.examTitle}</b>
                    <Typography
                      sx={{ fontSize: 12, color: "#64748b", maxWidth: 260 }}
                      noWrap
                    >
                      {row.examDesc}
                    </Typography>
                  </StyledTableCell>

                  <StyledTableCell>
                    <Chip
                      label={row.examType === "course" ? "Course" : "Chapter"}
                      color={
                        row.examType === "course" ? "primary" : "secondary"
                      }
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </StyledTableCell>

                  <StyledTableCell>{row.courseId}</StyledTableCell>
                  <StyledTableCell>{row.chId || "NULL"}</StyledTableCell>
                  <StyledTableCell>{row.durationMinutes} min</StyledTableCell>
                  <StyledTableCell>{row.totalMarks}</StyledTableCell>
                  <StyledTableCell>{row.passingMarks}</StyledTableCell>
                  <StyledTableCell>{row.maxAttempts}</StyledTableCell>
                  <StyledTableCell>{row.accessType}</StyledTableCell>

                  <StyledTableCell>
                    <Chip
                      label={row.isPublished === 1 ? "Published" : "Draft"}
                      color={row.isPublished === 1 ? "success" : "warning"}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
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
                    {row.isPublished === 0 && (
                      <IconButton
                        color="primary"
                        onClick={() =>
                          router.push(`/admin/exams/edit/${row.examId}`)
                        }
                      >
                        <EditIcon />
                      </IconButton>
                    )}

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
    </Box>
  );
}

function StatBox({ label, value, color }) {
  return (
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
        {label}
      </Typography>
      <Typography sx={{ fontSize: 30, fontWeight: 900, color }}>
        {value}
      </Typography>
    </Box>
  );
}
