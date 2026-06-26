"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest, examApi } from "@/lib/apiHelper";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import QuizIcon from "@mui/icons-material/Quiz";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import SchoolIcon from "@mui/icons-material/School";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LockIcon from "@mui/icons-material/Lock";

export default function UserExamListClient() {
  const router = useRouter();

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchExams = async () => {
    try {
      setLoading(true);

      const service = examApi.getAvailableExams;
      const req = {
        method: "GET"
      };

      const res = await apiRequest(service, req);

      if (!res.success) {
        console.log("FETCH USER EXAMS ERROR:", res.message);
        return;
      }

      setExams(res.data?.data || []);
    } catch (err) {
      console.log("FETCH USER EXAMS ERROR:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  if (loading) {
    return (
      <Box className="min-h-screen flex items-center justify-center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box
      className="min-h-screen"
      sx={{
        background: "linear-gradient(135deg, #f8fafc 0%, #eef2ff 100%)",
        p: { xs: 2, sm: 4 },
      }}
    >
      <Box sx={{ mb: 3 }}>
        <Typography
          sx={{
            fontSize: { xs: 28, sm: 38 },
            fontWeight: 900,
            color: "#111827",
          }}
        >
          My Exams
        </Typography>

        <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
          View your available course tests and chapter tests.
        </Typography>
      </Box>

      {exams.length === 0 ? (
        <Box
          sx={{
            bgcolor: "white",
            borderRadius: 4,
            p: 5,
            textAlign: "center",
            border: "1px solid #e5e7eb",
          }}
        >
          <Typography fontWeight={900} fontSize={22}>
            No exams available
          </Typography>
          <Typography sx={{ color: "#64748b", mt: 1 }}>
            Your tests will appear here after admin publishes them.
          </Typography>
        </Box>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, 1fr)",
              lg: "repeat(3, 1fr)",
            },
            gap: 2,
          }}
        >
          {exams.map((exam) => (
            <Card
              key={exam.examId}
              sx={{
                borderRadius: 5,
                border: "1px solid #e5e7eb",
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  p: 2,
                  background:
                    exam.examType === "course"
                      ? "linear-gradient(135deg,#6d28d9,#9333ea)"
                      : "linear-gradient(135deg,#2563eb,#7c3aed)",
                  color: "white",
                }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 1,
                    alignItems: "flex-start",
                  }}
                >
                  <Box>
                    <Typography fontSize={13} fontWeight={800}>
                      Exam ID #{exam.examId}
                    </Typography>

                    <Typography fontSize={18} fontWeight={900}>
                      {exam.examTitle}
                    </Typography>
                  </Box>

                  <Chip
                    label={exam.examType === "course" ? "Course" : "Chapter"}
                    size="small"
                    sx={{
                      bgcolor: "white",
                      color: "#6d28d9",
                      fontWeight: 900,
                    }}
                  />
                </Box>
              </Box>

              <CardContent>
                <Stack spacing={1.2}>
                  <Info
                    icon={<SchoolIcon fontSize="small" />}
                    label="Course"
                    value={exam.courseName || "N/A"}
                  />

                  {exam.examType === "chapter" && (
                    <Info
                      icon={<QuizIcon fontSize="small" />}
                      label="Chapter"
                      value={exam.chapterName || "N/A"}
                    />
                  )}

                  <Info
                    icon={<AccessTimeIcon fontSize="small" />}
                    label="Duration"
                    value={`${exam.durationMinutes} minutes`}
                  />

                  <Info
                    icon={<CheckCircleIcon fontSize="small" />}
                    label="Marks"
                    value={`${exam.totalMarks} marks / Passing ${exam.passingMarks}`}
                  />

                  <Info
                    icon={<QuizIcon fontSize="small" />}
                    label="Attempts"
                    value={`${exam.attemptCount || 0} / ${exam.maxAttempts}`}
                  />

                  {exam.hasResult ? (
                    <Stack spacing={1}>
                      <Chip
                        label={
                          exam.isPendingCheck
                            ? "Pending Check"
                            : exam.isPassed
                              ? "Passed"
                              : "Failed"
                        }
                        color={
                          exam.isPendingCheck
                            ? "warning"
                            : exam.isPassed
                              ? "success"
                              : "error"
                        }
                        sx={{ fontWeight: 900 }}
                      />

                      {exam.isPendingCheck ? null : exam.isPassed ? (
                        <Button
                          variant="contained"
                          onClick={() =>
                            router.push(`/user/exams/result/${exam.attemptId}`)
                          }
                          sx={{
                            mt: 1,
                            bgcolor: "#2563eb",
                            borderRadius: 3,
                            py: 1.2,
                            fontWeight: 900,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#1d4ed8" },
                          }}
                        >
                          See Result
                        </Button>
                      ) : exam.canTryAgain ||
                        Number(exam.attemptCount || 0) <
                          Number(exam.maxAttempts || 0) ? (
                        <Button
                          variant="contained"
                          onClick={() =>
                            router.push(`/user/exams/result/${exam.attemptId}`)
                          }
                          sx={{
                            mt: 1,
                            bgcolor: "#16a34a",
                            borderRadius: 3,
                            py: 1.2,
                            fontWeight: 900,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#15803d" },
                          }}
                        >
                          Try Again
                        </Button>
                      ) : (
                        <Button
                          variant="contained"
                          onClick={() =>
                            router.push(`/user/exams/result/${exam.attemptId}`)
                          }
                          sx={{
                            mt: 1,
                            bgcolor: "#2563eb",
                            borderRadius: 3,
                            py: 1.2,
                            fontWeight: 900,
                            textTransform: "none",
                            "&:hover": { bgcolor: "#1d4ed8" },
                          }}
                        >
                          See Result
                        </Button>
                      )}
                    </Stack>
                  ) : exam.canStart ? (
                    <Button
                      variant="contained"
                      onClick={() =>
                        router.push(`/user/exams/${exam.examId}/start`)
                      }
                      sx={{
                        mt: 1,
                        bgcolor: "#6d28d9",
                        borderRadius: 3,
                        py: 1.2,
                        fontWeight: 900,
                        textTransform: "none",
                        "&:hover": { bgcolor: "#5b21b6" },
                      }}
                    >
                      Start Exam
                    </Button>
                  ) : (
                    <Box
                      sx={{
                        mt: 1,
                        p: 1.5,
                        borderRadius: 3,
                        bgcolor: "#fff7ed",
                        color: "#c2410c",
                        display: "flex",
                        gap: 1,
                      }}
                    >
                      <LockIcon fontSize="small" />
                      <Typography fontSize={13} fontWeight={800}>
                        {exam.lockReason || "Exam locked"}
                      </Typography>
                    </Box>
                  )}
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

function Info({ icon, label, value }) {
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
