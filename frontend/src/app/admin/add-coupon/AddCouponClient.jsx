"use client";

import { useState } from "react";
import axios from "axios";
import API_URL from "@/config/api";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";

export default function AddCouponClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [coupon, setCoupon] = useState({
    couponCode: "",
    discountType: "percentage",
    discountValue: "",
    minOrderAmount: "0",
    maxDiscountAmount: "",
    usageLimit: "",
    isActive: 1,
    startDate: "",
    endDate: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;

    setCoupon((prev) => ({
      ...prev,
      [name]:
        name === "isActive"
          ? Number(value)
          : name === "couponCode"
            ? value.toUpperCase().replace(/\s/g, "")
            : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (loading) return;

    if (!coupon.couponCode.trim()) {
      alert("Please enter coupon code");
      return;
    }

    if (!coupon.discountValue || Number(coupon.discountValue) <= 0) {
      alert("Please enter valid discount value");
      return;
    }

    if (
      coupon.discountType === "percentage" &&
      Number(coupon.discountValue) > 100
    ) {
      alert("Percentage discount cannot be more than 100%");
      return;
    }

    if (
      coupon.startDate &&
      coupon.endDate &&
      new Date(coupon.endDate) < new Date(coupon.startDate)
    ) {
      alert("End date cannot be before start date");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        couponCode: coupon.couponCode,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        minOrderAmount: Number(coupon.minOrderAmount || 0),
        maxDiscountAmount: coupon.maxDiscountAmount
          ? Number(coupon.maxDiscountAmount)
          : null,
        usageLimit: coupon.usageLimit ? Number(coupon.usageLimit) : null,
        isActive: Number(coupon.isActive),
        startDate: coupon.startDate || null,
        endDate: coupon.endDate || null,
      };

      const res = await axios.post(`${API_URL}/coupons/add`, payload, {
        withCredentials: true,
      });

      alert(res.data.message || "Coupon added successfully");
      router.push("/admin/coupons");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add coupon");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "#f8fafc", py: 5, px: 2 }}>
      <Paper
        sx={{
          maxWidth: 900,
          mx: "auto",
          p: { xs: 2.5, sm: 4 },
          borderRadius: 4,
          border: "1px solid #ede9fe",
        }}
      >
        <Typography
          sx={{
            fontSize: 28,
            fontWeight: 800,
            color: "#6d28d9",
            textAlign: "center",
            mb: 1,
          }}
        >
          Add New Coupon
        </Typography>

        <Typography
          sx={{
            textAlign: "center",
            color: "#6b7280",
            fontSize: 14,
            mb: 3,
          }}
        >
          Create discount coupons for course purchases
        </Typography>

        <form onSubmit={handleSubmit}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              gap: 2,
            }}
          >
            <TextField
              label="Coupon Code"
              name="couponCode"
              value={coupon.couponCode}
              onChange={handleChange}
              placeholder="WELCOME50"
              required
            />

            <FormControl required>
              <InputLabel>Discount Type</InputLabel>
              <Select
                name="discountType"
                label="Discount Type"
                value={coupon.discountType}
                onChange={handleChange}
              >
                <MenuItem value="percentage">Percentage</MenuItem>
                <MenuItem value="fixed">Fixed Amount</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label={
                coupon.discountType === "percentage"
                  ? "Discount Percentage"
                  : "Discount Amount"
              }
              name="discountValue"
              type="number"
              value={coupon.discountValue}
              onChange={handleChange}
              required
            />

            <TextField
              label="Minimum Order Amount"
              name="minOrderAmount"
              type="number"
              value={coupon.minOrderAmount}
              onChange={handleChange}
              required
            />

            <TextField
              label="Maximum Discount Amount"
              name="maxDiscountAmount"
              type="number"
              value={coupon.maxDiscountAmount}
              onChange={handleChange}
              helperText="Optional"
            />

            <TextField
              label="Usage Limit"
              name="usageLimit"
              type="number"
              value={coupon.usageLimit}
              onChange={handleChange}
              helperText="Leave empty for unlimited usage"
            />

            <TextField
              label="Start Date"
              name="startDate"
              type="date"
              value={coupon.startDate}
              onChange={handleChange}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <TextField
              label="End Date"
              name="endDate"
              type="date"
              value={coupon.endDate}
              onChange={handleChange}
              slotProps={{
                inputLabel: {
                  shrink: true,
                },
              }}
            />

            <FormControl required>
              <InputLabel>Status</InputLabel>
              <Select
                name="isActive"
                label="Status"
                value={coupon.isActive}
                onChange={handleChange}
              >
                <MenuItem value={1}>Active</MenuItem>
                <MenuItem value={0}>Inactive</MenuItem>
              </Select>
            </FormControl>
          </Box>

          <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
            <Button
              type="button"
              variant="outlined"
              fullWidth
              onClick={() => router.push("/admin/coupons")}
            >
              Cancel
            </Button>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading}
              sx={{
                bgcolor: "#6d28d9",
                "&:hover": { bgcolor: "#5b21b6" },
              }}
            >
              {loading ? "Adding..." : "Add Coupon"}
            </Button>
          </Box>
        </form>
      </Paper>
    </Box>
  );
}
