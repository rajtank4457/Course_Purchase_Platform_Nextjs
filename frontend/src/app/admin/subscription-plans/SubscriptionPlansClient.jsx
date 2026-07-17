"use client";

import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography, Button, Snackbar, Alert } from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SummaryCards from "./components/SummaryCards";
import PlanToolbar from "./components/PlanToolbar";
import PlanTable from "./components/PlanTable";
import DeleteDialog from "./components/DeleteDialog";
import ViewPlanDialog from "./components/ViewPlanDialog";
import PlanDialog from "./components/PlanDialog";
import { apiRequest, subscriptionApi } from "@/lib/apiHelper";

export default function SubscriptionPlansClient() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  const [roleFilter, setRoleFilter] = useState("all");
  const [sortBy, setSortBy] = useState("latest");

  const [deletePlan, setDeletePlan] = useState(null);
  const [viewPlan, setViewPlan] = useState(null);
  const [editPlan, setEditPlan] = useState(null);
  const [openPlanDialog, setOpenPlanDialog] = useState(false);

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

      const res = await apiRequest(subscriptionApi.getPlans);

      if (!res.success) {
        throw new Error(res.message);
      }

      const plans = res.data?.data || [];

      setPlans(
        plans.map((plan) => ({
          ...plan,
          status: plan.isActive ? "Active" : "Inactive",
          subscribers: Number(plan.subscribers || 0),
          revenue: Number(plan.revenue || 0),
        })),
      );
    } catch (err) {
      console.error(err);

      setSnackbar({
        open: true,
        severity: "error",
        message: err.message || "Unable to load plans",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSavePlan(payload) {
    try {
      let res;

      if (editPlan) {
        res = await apiRequest(subscriptionApi.updatePlan(editPlan.planId), {
          method: "PUT",
          data: payload,
        });
      } else {
        res = await apiRequest(subscriptionApi.addPlan, {
          method: "POST",
          data: payload,
        });
      }

      if (!res.success) {
        throw new Error(res.message);
      }

      setSnackbar({
        open: true,
        severity: "success",
        message: res.message,
      });

      setOpenPlanDialog(false);
      setEditPlan(null);

      loadPlans();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.message,
      });
    }
  }

  async function handleDeletePlan() {
    try {
      const res = await apiRequest(
        subscriptionApi.deletePlan(deletePlan.planId),
        {
          method: "DELETE",
        },
      );

      if (!res.success) {
        throw new Error(res.message);
      }

      setSnackbar({
        open: true,
        severity: "success",
        message: res.message,
      });

      setDeletePlan(null);

      loadPlans();
    } catch (err) {
      setSnackbar({
        open: true,
        severity: "error",
        message: err.message,
      });
    }
  }

  const filteredPlans = useMemo(() => {
    let data = [...plans];
    console.log(plans);
    if (search) {
      data = data.filter((plan) =>
        plan.planName.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (roleFilter !== "all") {
      data = data.filter((plan) => plan.targetRole === roleFilter);
    }

    switch (sortBy) {
      case "priceLow":
        data.sort((a, b) => a.price - b.price);
        break;

      case "priceHigh":
        data.sort((a, b) => b.price - a.price);
        break;

      case "name":
        data.sort((a, b) => a.planName.localeCompare(b.planName));
        break;

      case "duration":
        data.sort((a, b) => a.durationDays - b.durationDays);
        break;

      default:
        data.sort(
          (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0),
        );
    }

    return data;
  }, [plans, search, roleFilter, sortBy]);

  const summary = useMemo(() => {
    return {
      totalPlans: plans.length,

      activePlans: plans.filter((plan) => plan.isActive).length,

      subscribers: plans.reduce(
        (total, plan) => total + Number(plan.subscribers || 0),
        0,
      ),

      totalRevenue: plans.reduce(
        (total, plan) => total + Number(plan.revenue || 0),
        0,
      ),
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

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setEditPlan(null);
            setOpenPlanDialog(true);
          }}
        >
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
        <PlanToolbar
          search={search}
          setSearch={setSearch}
          roleFilter={roleFilter}
          setRoleFilter={setRoleFilter}
          sortBy={sortBy}
          setSortBy={setSortBy}
        />

        <PlanTable
          rows={filteredPlans}
          loading={loading}
          onView={async (row) => {
            const res = await apiRequest(
              subscriptionApi.getPlanById(row.planId),
            );

            if (res.success) {
              setViewPlan(res.data.data);
            }
          }}
          onEdit={async (row) => {
            const res = await apiRequest(
              subscriptionApi.getPlanById(row.planId),
            );

            if (res.success) {
              setEditPlan(res.data.data);
              setOpenPlanDialog(true);
            }
          }}
          onDelete={(row) => setDeletePlan(row)}
        />
      </Paper>

      <ViewPlanDialog
        open={Boolean(viewPlan)}
        plan={viewPlan}
        onClose={() => setViewPlan(null)}
      />

      <PlanDialog
        open={openPlanDialog}
        plan={editPlan}
        onSave={handleSavePlan}
        onClose={() => {
          setOpenPlanDialog(false);
          setEditPlan(null);
        }}
      />

      <DeleteDialog
        open={Boolean(deletePlan)}
        plan={deletePlan}
        onDelete={handleDeletePlan}
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
