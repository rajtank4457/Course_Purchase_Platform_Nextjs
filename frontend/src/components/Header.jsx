"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useRouter } from "next/navigation";

import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Tooltip,
  useMediaQuery,
  Typography,
} from "@mui/material";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";

import { GraduationCap } from "lucide-react";
import { socket } from "@/lib/socket";
import NotificationsIcon from "@mui/icons-material/Notifications";

import MenuIcon from "@mui/icons-material/Menu";
import API_URL from "@/config/api.js";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentAddIcon from "@mui/icons-material/AssignmentAdd";

export default function Header() {
  const router = useRouter();
  const isMobile = useMediaQuery("(max-width:768px)");

  const [role, setRole] = useState("");
  const [type, setType] = useState("");
  const [userName, setUserName] = useState("");
  const [userLoading, setUserLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const [cartCount, setCartCount] = useState(0);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [currentUserId, setCurrentUserId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);

  const notificationOpen = Boolean(notificationAnchor);
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const menuOpen = Boolean(anchorEl);

  useEffect(() => {
    const setUserData = (user) => {
      setCurrentUserId(user.userId || user.adminId || null);
      setUserEmail(user.email || "");

      if (user.adminName || user.type === "admin") {
        setUserName(user.adminName);
        setRole(user.role || "");
        setType("admin");
      } else {
        setUserName(`${user.firstName || ""} ${user.lastName || ""}`.trim());
        setRole("user");
        setType("user");
      }

      const storedCartCount = localStorage.getItem("cartCount");
      if (storedCartCount) {
        setCartCount(Number(storedCartCount));
      }

      fetchCartCount();
    };

    const fetchLoggedUser = async (showLoading = false) => {
      try {
        if (showLoading) setUserLoading(true);

        const res = await axios.get(`${API_URL}/auth/home`, {
          withCredentials: true,
        });

        const user = res.data.user;

        setUserData(user);
        localStorage.setItem("currentUser", JSON.stringify(user));
      } catch (err) {
        console.log("Header user fetch failed:", err);
        localStorage.removeItem("currentUser");
      } finally {
        setUserLoading(false);
      }
    };

    const storedUser = localStorage.getItem("currentUser");

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUserData(user);
        setUserLoading(false);

        fetchLoggedUser(false);
      } catch {
        localStorage.removeItem("currentUser");
        fetchLoggedUser(true);
      }
    } else {
      fetchLoggedUser(true);
    }
  }, []);

  const isAdmin =
    type === "admin" ||
    role === "admin" ||
    role === "super_admin" ||
    role === "super_admin";

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${API_URL}/notifications`, {
        withCredentials: true,
      });

      const list = Array.isArray(res.data)
        ? res.data
        : Array.isArray(res.data?.data)
          ? res.data.data
          : Array.isArray(res.data?.notifications)
            ? res.data.notifications
            : [];

      setNotifications(list);
    } catch (err) {
      console.error("Notifications fetch failed:", err);
      setNotifications([]);
    }
  };

  useEffect(() => {
    if (!currentUserId || isAdmin) return;
    fetchNotifications();
  }, [currentUserId, isAdmin]);

  useEffect(() => {
    if (!currentUserId && !isAdmin) return;

    const joinRoom = () => {
      if (isAdmin) {
        socket.emit("joinAdmin");
      } else {
        socket.emit("joinUser", currentUserId);
      }
    };

    if (socket.connected) joinRoom();
    socket.on("connect", joinRoom);

    const handleNotification = (data) => {
      setNotifications((prev) => [
        {
          ...data,
          notificationId: data.notificationId || null,
          isRead: 0,
          createdAt: new Date().toISOString(),
        },
        ...prev,
      ]);
    };

    socket.on("newNotification", handleNotification);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("newNotification", handleNotification);
    };
  }, [currentUserId, isAdmin]);

  const goDashboard = () => {
    if (isAdmin) {
      router.push("/admin/dashboard");
    } else {
      router.push("/user/dashboard");
    }
  };

  const handleLogo = () => {
    if (isAdmin) {
      router.push("/admin/dashboard");
    } else {
      router.push("/");
    }
  };

  const goCourses = () => {
    if (isAdmin) {
      router.push("/admin/courses");
    } else {
      router.push("/user/courses");
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(
        `${API_URL}/auth/logout`,
        {},
        {
          withCredentials: true,
        },
      );
    } catch (err) {
      console.log("Logout API failed:", err.message);
    } finally {
      localStorage.clear();
      router.replace("/login");
    }
  };

  const drawerList = (
    <Box sx={{ width: 270, pt: 2 }}>
      <List>
        <ListItem>
          <ListItemText
            primary={<Typography fontWeight={700}>{userName}</Typography>}
            secondary={userEmail}
          />
        </ListItem>

        <Divider />

        <ListItem disablePadding>
          <ListItemButton onClick={goDashboard}>
            <ListItemIcon>
              <SpaceDashboardIcon />
            </ListItemIcon>
            <ListItemText primary="Dashboard" />
          </ListItemButton>
        </ListItem>

        <ListItem disablePadding>
          <ListItemButton onClick={goCourses}>
            <ListItemIcon>
              <MenuBookIcon />
            </ListItemIcon>
            <ListItemText primary={isAdmin ? "Manage Courses" : "My Courses"} />
          </ListItemButton>
        </ListItem>

        {isAdmin ? (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => router.push("/admin/students")}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Students" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => router.push("/admin/admins")}>
                <ListItemIcon>
                  <PersonIcon />
                </ListItemIcon>
                <ListItemText primary="Admins" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => router.push("/admin/orders")}>
                <ListItemIcon>
                  <AssignmentAddIcon />
                </ListItemIcon>
                <ListItemText primary="Orders" />
              </ListItemButton>
            </ListItem>
          </>
        ) : (
          <>
            <ListItem disablePadding>
              <ListItemButton onClick={() => router.push("/user/cart")}>
                <ListItemIcon>
                  <Badge badgeContent={cartCount} color="error">
                    <ShoppingCartIcon />
                  </Badge>
                </ListItemIcon>
                <ListItemText primary="Cart" />
              </ListItemButton>
            </ListItem>

            <ListItem disablePadding>
              <ListItemButton onClick={() => router.push("/user/orders")}>
                <ListItemIcon>
                  <AssignmentAddIcon />
                </ListItemIcon>
                <ListItemText primary="My Orders" />
              </ListItemButton>
            </ListItem>
          </>
        )}

        <Divider />

        <ListItem disablePadding>
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Logout" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  const fetchCartCount = async () => {
    try {
      if (role !== "user") {
        setCartCount(0);
        return;
      }

      const res = await axios.get(`${API_URL}/cart/count`, {
        withCredentials: true,
      });

      setCartCount(res.data?.data?.count || res.data?.count || 0);
    } catch (err) {
      console.error("Cart count fetch failed:", err);
      setCartCount(0);
    }
  };

  useEffect(() => {
    const updateCartCount = () => {
      if (role === "user") {
        fetchCartCount();
      } else {
        setCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, [role]);

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* LOGO */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={handleLogo}
        >
          <GraduationCap className="h-8 w-8 text-purple-700" />
          <h1 className="text-2xl font-bold text-purple-700">CourseHub</h1>

          <Button
            onClick={() => setDrawerOpen(true)}
            sx={{
              color: "#6d28d9",
              minWidth: 42,
            }}
          >
            <MenuIcon />
          </Button>
        </div>

        {/* DESKTOP MENU */}
        {!isMobile && (
          <nav className="flex items-center gap-6">
            <button
              onClick={goDashboard}
              className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
            >
              Dashboard
            </button>

            <button
              onClick={goCourses}
              className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
            >
              {isAdmin ? "Courses" : "My Courses"}
            </button>

            {isAdmin ? (
              <>
                <button
                  onClick={() => router.push("/admin/exams/examlist")}
                  className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
                >
                  Exam List
                </button>

                <button
                  onClick={() => router.push("/admin/students")}
                  className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
                >
                  Students
                </button>

                <button
                  onClick={() => router.push("/admin/admins")}
                  className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
                >
                  Admins
                </button>

                <button
                  onClick={() => router.push("/admin/orders")}
                  className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
                >
                  Orders
                </button>
              </>
            ) : (
              <div className="flex items-center gap-6">
                <button
                  onClick={() => router.push("/user/orders")}
                  className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
                >
                  My Orders
                </button>
                <button
                  onClick={() => router.push("/user/exams/examlist")}
                  className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
                >
                  My Exams
                </button>
              </div>
            )}
          </nav>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          <IconButton
            onClick={(e) => setNotificationAnchor(e.currentTarget)}
            className="!rounded-xl !bg-purple-100 !p-3 !text-purple-700 transition hover:!bg-purple-200"
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              invisible={unreadCount === 0}
            >
              <NotificationsIcon className="text-purple-700" />
            </Badge>
          </IconButton>
          {!isAdmin && (
            <div className="flex items-center gap-3">
              <IconButton
                onClick={() => router.push("/user/cart")}
                className="!rounded-xl !bg-purple-100 !p-3 !text-purple-700 transition hover:!bg-purple-200 ml-8"
              >
                <Badge
                  badgeContent={cartCount}
                  color="error"
                  invisible={cartCount === 0}
                >
                  <ShoppingCartIcon className="text-purple-700" />
                </Badge>
              </IconButton>
            </div>
          )}

          {!isMobile && (
            <p className="text-sm font-medium text-gray-700">
              Welcome,{" "}
              <span className="font-bold text-purple-700">
                {userLoading ? "Loading..." : userName}
              </span>
            </p>
          )}

          <Menu
            anchorEl={notificationAnchor}
            open={notificationOpen}
            onClose={() => setNotificationAnchor(null)}
            slotProps={{
              paper: {
                sx: {
                  width: 360,
                  maxHeight: 420,
                  borderRadius: 3,
                  mt: 1,
                },
              },
            }}
          >
            <Box
              sx={{
                px: 2,
                py: 1.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 2,
              }}
            >
              <Box>
                <Typography fontWeight={800}>Notifications</Typography>
                <Typography variant="caption" color="text.secondary">
                  Real-time notification updates
                </Typography>
              </Box>

              {notifications.length > 0 && (
                <Button
                  size="small"
                  color="error"
                  onClick={async (e) => {
                    e.stopPropagation();

                    try {
                      await axios.delete(`${API_URL}/notifications/clear-all`, {
                        withCredentials: true,
                      });

                      setNotifications([]);
                    } catch (err) {
                      console.log(
                        "CLEAR NOTIFICATIONS ERROR:",
                        err.response?.data || err,
                      );
                    }
                  }}
                >
                  Clear All
                </Button>
              )}
            </Box>

            <Divider />

            {notifications.length === 0 ? (
              <Box sx={{ p: 3, textAlign: "center" }}>
                <Typography fontWeight={700} color="text.secondary">
                  No notifications yet
                </Typography>
              </Box>
            ) : (
              notifications.map((item, index) => (
                <MenuItem
                  key={item.notificationId || index}
                  onClick={async () => {
                    const notificationType = item.type || item.notificationType;

                    setNotifications((prev) =>
                      prev.map((n, i) =>
                        i === index ? { ...n, isRead: 1 } : n,
                      ),
                    );

                    // Close menu first
                    setNotificationAnchor(null);

                    // Navigate even if mark-read API fails
                    if (notificationType === "exam_result" || item.attemptId) {
                      router.push(`/user/exams/result/${item.attemptId}`);
                    } else if (item.examId) {
                      router.push(
                        isAdmin
                          ? "/admin/exams/examlist"
                          : `/user/exams/${item.examId}/start`,
                      );
                    } else {
                      router.push(
                        isAdmin
                          ? "/admin/exams/examlist"
                          : "/user/exams/examlist",
                      );
                    }

                    // Mark read safely
                    if (item.notificationId && !isAdmin) {
                      try {
                        await axios.post(
                          `${API_URL}/notifications/mark-read`,
                          { notificationId: item.notificationId },
                          { withCredentials: true },
                        );
                      } catch (err) {
                        console.log(
                          "MARK READ ERROR:",
                          err.response?.data || err,
                        );
                      }
                    }
                  }}
                >
                  <NotificationsIcon sx={{ color: "#6d28d9", mt: 0.5 }} />

                  <Box>
                    <Typography fontSize={14} fontWeight={800}>
                      {item.title || "Notification"}
                    </Typography>

                    <Typography fontSize={13} color="text.secondary">
                      {item.message}
                    </Typography>
                  </Box>
                </MenuItem>
              ))
            )}
          </Menu>

          <Tooltip title="Account">
            <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: "#7e22ce",
                  color: "white",
                  fontWeight: 700,
                }}
              >
                {userLoading ? "" : userName?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Tooltip>

          <button
            onClick={handleLogout}
            className="hidden rounded-xl bg-red-500 px-5 py-2 cursor-pointer text-sm font-semibold text-white transition hover:bg-red-600 sm:block"
          >
            Logout
          </button>
        </div>
      </div>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        {drawerList}
      </Drawer>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/profile");
          }}
        >
          <Avatar sx={{ mr: 1, bgcolor: "#ede9fe", color: "#6d28d9" }} />
          Profile
        </MenuItem>

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push("/admin/coupons");
          }}
        >
          <Box
            sx={{
              ml: 0.25,
              mr: 1.5,
              width: 38,
              height: 38,
              borderRadius: 2,
              bgcolor: "#ede9fe",
              color: "#6d28d9",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <CardGiftcardIcon />
          </Box>
          Coupon
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </header>
  );
}
