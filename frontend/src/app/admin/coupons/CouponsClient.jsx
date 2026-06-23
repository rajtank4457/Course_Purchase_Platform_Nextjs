"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  Chip,
  MenuItem,
  Paper,
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
} from "@mui/material";
import { styled } from "@mui/material/styles";
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
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  "&:nth-of-type(odd)": {
    backgroundColor: theme.palette.action.hover,
  },
}));

export default function CouponsClient() {
  const router = useRouter();

  const [coupons, setCoupons] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [discountType, setDiscountType] = useState("all");

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchCoupons = async () => {
    try {
      const res = await axios.get(`${API_URL}/coupons`, {
        withCredentials: true,
      });

      console.log("COUPONS RESPONSE:", res.data);

      const coupons = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : [];

      setCoupons(coupons);
    } catch (err) {
      console.error("FETCH COUPONS ERROR:", err.response?.data || err);
      alert(err.response?.data?.message || "Failed to fetch coupons");
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const filteredCoupons = coupons.filter((coupon) => {
    const statusMatch =
      statusFilter === "all" || String(coupon.isActive) === statusFilter;

    const typeMatch =
      discountType === "all" || coupon.discountType === discountType;

    return statusMatch && typeMatch;
  });

  const paginatedCoupons = filteredCoupons.slice(
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
      <Box
        sx={{
          mb: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
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
            Coupons
          </Typography>

          <Typography sx={{ color: "#6b7280", fontSize: 14 }}>
            Manage discount coupons, usage limit and validity
          </Typography>
        </Box>

        <Button
          onClick={() => router.push("/admin/add-coupon")}
          sx={{
            borderRadius: 999,
            px: 3,
            py: 1,
            bgcolor: "#6d28d9",
            color: "white",
            textTransform: "none",
            fontWeight: 800,
            "&:hover": { bgcolor: "#5b21b6" },
          }}
        >
          + Add Coupon
        </Button>
      </Box>

      <Box
        sx={{
          mb: 2,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 1.5,
        }}
      >
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
          sx={{ bgcolor: "white", borderRadius: 3 }}
        >
          <MenuItem value="all">All Coupons</MenuItem>
          <MenuItem value="1">Active</MenuItem>
          <MenuItem value="0">Inactive</MenuItem>
        </TextField>

        <TextField
          select
          label="Discount Type"
          value={discountType}
          onChange={(e) => {
            setDiscountType(e.target.value);
            setPage(0);
          }}
          size="small"
          fullWidth
          sx={{ bgcolor: "white", borderRadius: 3 }}
        >
          <MenuItem value="all">All Types</MenuItem>
          <MenuItem value="percentage">Percentage</MenuItem>
          <MenuItem value="fixed">Fixed</MenuItem>
        </TextField>
      </Box>

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
              <StyledTableCell>ID</StyledTableCell>
              <StyledTableCell>Coupon Code</StyledTableCell>
              <StyledTableCell>Type</StyledTableCell>
              <StyledTableCell>Value</StyledTableCell>
              <StyledTableCell>Min Order</StyledTableCell>
              <StyledTableCell>Max Discount</StyledTableCell>
              <StyledTableCell>Usage</StyledTableCell>
              <StyledTableCell>Status</StyledTableCell>
              <StyledTableCell>Start Date</StyledTableCell>
              <StyledTableCell>End Date</StyledTableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {paginatedCoupons.length === 0 ? (
              <TableRow>
                <StyledTableCell colSpan={10} align="center">
                  No coupons found
                </StyledTableCell>
              </TableRow>
            ) : (
              paginatedCoupons.map((coupon) => (
                <StyledTableRow key={coupon.couponId}>
                  <StyledTableCell>#{coupon.couponId}</StyledTableCell>

                  <StyledTableCell>
                    <b style={{ color: "#6d28d9" }}>{coupon.couponCode}</b>
                  </StyledTableCell>

                  <StyledTableCell>
                    <Chip
                      label={coupon.discountType}
                      color={
                        coupon.discountType === "percentage"
                          ? "primary"
                          : "secondary"
                      }
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </StyledTableCell>

                  <StyledTableCell>
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}%`
                      : `₹${coupon.discountValue}`}
                  </StyledTableCell>

                  <StyledTableCell>₹{coupon.minOrderAmount}</StyledTableCell>

                  <StyledTableCell>
                    {coupon.maxDiscountAmount
                      ? `₹${coupon.maxDiscountAmount}`
                      : "N/A"}
                  </StyledTableCell>

                  <StyledTableCell>
                    {coupon.usedCount || 0} / {coupon.usageLimit || "Unlimited"}
                  </StyledTableCell>

                  <StyledTableCell>
                    <Chip
                      label={coupon.isActive == 1 ? "Active" : "Inactive"}
                      color={coupon.isActive == 1 ? "success" : "error"}
                      size="small"
                      sx={{ fontWeight: 800 }}
                    />
                  </StyledTableCell>

                  <StyledTableCell>
                    {coupon.startDate
                      ? new Date(coupon.startDate).toLocaleDateString()
                      : "N/A"}
                  </StyledTableCell>

                  <StyledTableCell>
                    {coupon.endDate
                      ? new Date(coupon.endDate).toLocaleDateString()
                      : "N/A"}
                  </StyledTableCell>
                </StyledTableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          bgcolor: "white",
          borderRadius: 4,
          mt: 1.5,
          boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
        }}
      >
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredCoupons.length}
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
