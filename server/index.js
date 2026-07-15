import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import http from "http";
import { Server } from "socket.io";
import { decryptRequest } from "./middleware/cryptoMiddleware.js";

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
import { startExamPublishJob } from "./cron/examPublishJob.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import certificateRoutes from "./routes/certificateRoutes.js";
import activityRoutes from "./routes/activityRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import wishlistRoutes from "./routes/wishlistRoutes.js";
import achievementRoutes from "./routes/achievementRoutes.js";
import adminApprovalRoutes from "./routes/adminApprovalRoutes.js";
import roleRoutes from "./routes/roleRoutes.js";
import subscriptionRoutes from "./routes/subscriptionRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
import roleManagementRoutes from "./routes/roleManagementRoutes.js";
import storageRoutes from "./routes/storageRoutes.js";

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
app.use(express.urlencoded({ extended: true }));

app.use(decryptRequest);

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
app.use("/notifications", notificationRoutes);
app.use("/certificates", certificateRoutes);
app.use("/activity", activityRoutes);
app.use("/attendance", attendanceRoutes);
app.use("/wishlist", wishlistRoutes);
app.use("/achievements", achievementRoutes);
app.use("/admin-approvals", adminApprovalRoutes);
app.use("/roles", roleRoutes);
app.use("/subscriptions", subscriptionRoutes);
app.use("/faculty", facultyRoutes);
app.use("/role-management", roleManagementRoutes);
app.use("/storage", storageRoutes);

/* Static Uploads */

app.use("/uploads/pdfs", express.static("uploads"));

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

const server = http.createServer(app);

export const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

app.set("io", io);

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("joinUser", (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User joined room: user_${userId}`);
  });

  socket.on("joinAdmin", () => {
    socket.join("admins");
    console.log("Admin joined admins room");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

startExamPublishJob(io);

const PORT = process.env.PORT || 1912;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on("error", (err) => {
  console.log("SERVER ERROR:", err);
});