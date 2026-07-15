"use client";

import { useMemo, useState } from "react";
import {
  Box,
  Chip,
  IconButton,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineOutlinedIcon from "@mui/icons-material/DeleteOutlineOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";

const headCells = [
  { id: "name", label: "Plan Name" },
  { id: "price", label: "Price" },
  { id: "duration", label: "Duration" },
  { id: "organizations", label: "Organizations" },
  { id: "status", label: "Status" },
  { id: "createdAt", label: "Created" },
  { id: "actions", label: "Actions", sortable: false },
];

export default function PlanTable({ rows = [], onEdit, onDelete, onView }) {
  const [orderBy, setOrderBy] = useState("createdAt");
  const [order, setOrder] = useState("desc");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  const sortedRows = useMemo(() => {
    const data = [...rows];

    data.sort((a, b) => {
      const valueA = a[orderBy];
      const valueB = b[orderBy];

      if (typeof valueA === "number") {
        return order === "asc" ? valueA - valueB : valueB - valueA;
      }

      return order === "asc"
        ? String(valueA ?? "").localeCompare(String(valueB ?? ""))
        : String(valueB ?? "").localeCompare(String(valueA ?? ""));
    });

    return data;
  }, [rows, orderBy, order]);

  const visibleRows = sortedRows.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        overflow: "hidden",
      }}
    >
      <TableContainer>
        <Table>
          <TableHead>
            <TableRow>
              {headCells.map((head) => (
                <TableCell key={head.id} sx={{ fontWeight: 700 }}>
                  {head.sortable === false ? (
                    head.label
                  ) : (
                    <TableSortLabel
                      active={orderBy === head.id}
                      direction={orderBy === head.id ? order : "asc"}
                      onClick={() => handleSort(head.id)}
                    >
                      {head.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>

          <TableBody>
            {visibleRows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="text.secondary">
                    No Subscription Plans Found
                  </Typography>
                </TableCell>
              </TableRow>
            )}

            {visibleRows.map((plan) => (
              <TableRow hover key={plan.id}>
                <TableCell>
                  <Typography fontWeight={600}>{plan.name}</Typography>
                </TableCell>

                <TableCell>₹{Number(plan.price).toLocaleString()}</TableCell>

                <TableCell>{plan.duration} Days</TableCell>

                <TableCell>{plan.organizations ?? 0}</TableCell>

                <TableCell>
                  <Chip
                    size="small"
                    label={plan.status}
                    color={plan.status === "Active" ? "success" : "default"}
                  />
                </TableCell>

                <TableCell>
                  {plan.createdAt
                    ? new Date(plan.createdAt).toLocaleDateString()
                    : "-"}
                </TableCell>

                <TableCell>
                  <Stack direction="row" spacing={1}>
                    <Tooltip title="View">
                      <IconButton
                        color="primary"
                        onClick={() => onView?.(plan)}
                      >
                        <VisibilityOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Edit">
                      <IconButton
                        color="warning"
                        onClick={() => onEdit?.(plan)}
                      >
                        <EditOutlinedIcon />
                      </IconButton>
                    </Tooltip>

                    <Tooltip title="Delete">
                      <IconButton
                        color="error"
                        onClick={() => onDelete?.(plan)}
                      >
                        <DeleteOutlineOutlinedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={sortedRows.length}
        page={page}
        rowsPerPage={rowsPerPage}
        rowsPerPageOptions={[5, 10, 25, 50]}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
}
