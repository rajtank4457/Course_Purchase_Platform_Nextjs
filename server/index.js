import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import path from "path";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import libraryRoutes from "./routes/libraryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import couponRoutes from "./routes/couponRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import chapterRoutes from "./routes/chapterRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import examRoutes from "./routes/examRoutes.js";


dotenv.config();

const app = express();

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options(
  /.*/,
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

/* Routes */

app.use("/auth", authRoutes);

app.use("/students", studentRoutes);

app.use("/admins", adminRoutes);

app.use("/courses", courseRoutes);

app.use("/cart", cartRoutes);

app.use("/library", libraryRoutes);

app.use("/orders", orderRoutes);

app.use("/coupons", couponRoutes);

app.use("/payments", paymentRoutes);

app.use("/dashboard", dashboardRoutes);

app.use("/chapters", chapterRoutes);

app.use("/progress", progressRoutes);

app.use("/exams", examRoutes);

/* Static Uploads */

app.use("/uploads/pdfs", express.static("uploads"));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

const PORT = process.env.PORT || 1912;

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on("error", (err) => {
  console.log("SERVER ERROR:", err);
});