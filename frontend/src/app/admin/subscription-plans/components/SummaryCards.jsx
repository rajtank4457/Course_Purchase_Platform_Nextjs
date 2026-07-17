"use client";

import { Grid2, Paper, Stack, Typography } from "@mui/material";

import Inventory2Icon from "@mui/icons-material/Inventory2";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import GroupsIcon from "@mui/icons-material/Groups";

const cards = [
  {
    key: "totalPlans",
    title: "Total Plans",
    icon: <Inventory2Icon color="primary" />,
  },
  {
    key: "activePlans",
    title: "Active Plans",
    icon: <CheckCircleIcon color="success" />,
  },
  {
    key: "totalRevenue",
    title: "Revenue",
    icon: <CurrencyRupeeIcon color="warning" />,
  },
  {
    key: "subscribers",
    title: "Subscribers",
    icon: <GroupsIcon color="secondary" />,
  },
];

export default function SummaryCards({ summary = {} }) {
  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-IN");
  };

  const formatCurrency = (value) => {
    return `₹${Number(value || 0).toLocaleString("en-IN")}`;
  };

  return (
    <Grid2 container spacing={2}>
      {cards.map((card) => {
        const value = summary?.[card.key] ?? 0;

        return (
          <Grid2
            key={card.key}
            size={{
              xs: 12,
              sm: 6,
              md: 3,
            }}
          >
            <Paper
              elevation={2}
              sx={{
                p: 3,
                borderRadius: 3,
                height: "100%",
                transition: "0.25s",
                "&:hover": {
                  boxShadow: 6,
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Stack
                direction="row"
                justifyContent="space-between"
                alignItems="center"
              >
                <Stack spacing={0.5}>
                  <Typography variant="body2" color="text.secondary">
                    {card.title}
                  </Typography>

                  <Typography variant="h5" fontWeight={700}>
                    {card.key === "totalRevenue"
                      ? formatCurrency(value)
                      : formatNumber(value)}
                  </Typography>
                </Stack>

                {card.icon}
              </Stack>
            </Paper>
          </Grid2>
        );
      })}
    </Grid2>
  );
}
