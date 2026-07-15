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

export default function SummaryCards({ summary }) {
  return (
    <Grid2 container spacing={2}>
      {cards.map((card) => (
        <Grid2 item xs={12} md={3} key={card.key}>
          <Paper
            elevation={2}
            sx={{
              p: 3,
              borderRadius: 3,
            }}
          >
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <div>
                <Typography color="text.secondary">{card.title}</Typography>

                <Typography variant="h5" fontWeight={700}>
                  {card.key === "totalRevenue"
                    ? `₹${summary[card.key].toLocaleString()}`
                    : summary[card.key]}
                </Typography>
              </div>

              {card.icon}
            </Stack>
          </Paper>
        </Grid2>
      ))}
    </Grid2>
  );
}
