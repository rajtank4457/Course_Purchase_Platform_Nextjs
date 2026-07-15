"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography, Button, Snackbar, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SummaryCards from "./components/SummaryCards";
import PlanToolbar from "./components/PlanToolbar";
import PlanTable from "./components/PlanTable";
import DeleteDialog from "./components/DeleteDialog";

// later we'll replace with apiHelper
// import { subscriptionPlanApi } from "@/lib/apiHelper";

const dummyPlans = [
  {
    planId: 1,
    planName: "Basic",
    targetRole: "Both",
    price: 999,
    durationDays: 30,
    maxStudents: 100,
    maxFaculty: 2,
    maxCourses: 5,
    maxChapters: 50,
    maxExams: 10,
    storageLimit: 2147483648,
    status: "Active",
    subscribers: 12,
  },
  {
    planId: 2,
    planName: "Plus",
    targetRole: "Both",
    price: 2499,
    durationDays: 30,
    maxStudents: 500,
    maxFaculty: 10,
    maxCourses: 20,
    maxChapters: 200,
    maxExams: 50,
    storageLimit: 10737418240,
    status: "Active",
    subscribers: 30,
  },
  {
    planId: 3,
    planName: "Premium",
    targetRole: "Both",
    price: 4999,
    durationDays: 30,
    maxStudents: 5000,
    maxFaculty: 50,
    maxCourses: 999,
    maxChapters: 9999,
    maxExams: 300,
    storageLimit: 53687091200,
    status: "Active",
    subscribers: 7,
  },
];

export default function SubscriptionPlansClient() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [deletePlan, setDeletePlan] = useState(null);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    try {
      setLoading(true);

      // Replace later
      // const res = await subscriptionPlanApi.getPlans();
      // setPlans(res.data.plans);

      setTimeout(() => {
        setPlans(dummyPlans);
        setLoading(false);
      }, 400);
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        message: "Unable to load subscription plans.",
        severity: "error",
      });

      setLoading(false);
    }
  }

  const filteredPlans = useMemo(() => {
    return plans.filter((plan) =>
      plan.planName.toLowerCase().includes(search.toLowerCase()),
    );
  }, [plans, search]);

  const summary = useMemo(() => {
    return {
      totalPlans: plans.length,
      activePlans: plans.filter((x) => x.status === "Active").length,
      totalRevenue: plans.reduce((sum, x) => sum + x.price * x.subscribers, 0),
      subscribers: plans.reduce((sum, x) => sum + x.subscribers, 0),
    };
  }, [plans]);

  return (
    <Box p={3}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Subscription Plans
          </Typography>

          <Typography color="text.secondary">
            Manage pricing and subscription plans.
          </Typography>
        </Box>

        <Button variant="contained" startIcon={<AddIcon />}>
          Create Plan
        </Button>
      </Box>

      <SummaryCards summary={summary} />

      <Paper
        sx={{
          mt: 3,
          p: 2,
          borderRadius: 3,
        }}
      >
        <PlanToolbar search={search} setSearch={setSearch} />

        <PlanTable
          rows={filteredPlans}
          loading={loading}
          onDelete={(row) => setDeletePlan(row)}
        />
      </Paper>

      <DeleteDialog
        open={Boolean(deletePlan)}
        plan={deletePlan}
        onClose={() => setDeletePlan(null)}
      />

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() =>
          setSnackbar({
            ...snackbar,
            open: false,
          })
        }
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
