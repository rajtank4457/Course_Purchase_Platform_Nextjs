"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  apiRequest,
  authApi,
  cartApi,
  notificationApi,
  wishlistApi,
  storageApi,
} from "@/lib/apiHelper";
import {
  Avatar,
  Badge,
  Box,
  Button,
  ClickAwayListener,
  Divider,
  Drawer,
  Grow,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  MenuList,
  Paper,
  Popper,
  Tooltip,
  useMediaQuery,
  Typography,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";

import { GraduationCap } from "lucide-react";
import { socket } from "@/lib/socket";
import NotificationsIcon from "@mui/icons-material/Notifications";

import MenuIcon from "@mui/icons-material/Menu";
import MenuBookIcon from "@mui/icons-material/MenuBook";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SpaceDashboardIcon from "@mui/icons-material/SpaceDashboard";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentAddIcon from "@mui/icons-material/Assignment";
import QuizIcon from "@mui/icons-material/Quiz";
import CalendarCheckIcon from "@mui/icons-material/CalendarMonth";
import FavoriteIcon from "@mui/icons-material/Favorite";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";

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
  const [wishlistCount, setWishlistCount] = useState(0);

  const [createAnchor, setCreateAnchor] = useState(null);
  const [hoverAnchor, setHoverAnchor] = useState(null);
  const [activeMenu, setActiveMenu] = useState(null);

  const [permissions, setPermissions] = useState([]);

  const [storage, setStorage] = useState({
    used: "0 MB",
    limit: "0 MB",
    percentage: 0,
  });

  const hoverOpen = Boolean(hoverAnchor);
  const createOpen = Boolean(createAnchor);

  const closeTimer = useRef(null);

  const openHoverMenu = (event, menu) => {
    clearTimeout(closeTimer.current);
    setHoverAnchor(event.currentTarget);
    setActiveMenu(menu);
  };

  const closeHoverMenu = () => {
    closeTimer.current = setTimeout(() => {
      setHoverAnchor(null);
      setActiveMenu(null);
    }, 250);
  };

  const cancelClose = () => {
    clearTimeout(closeTimer.current);
  };

  const getUser = () => {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
      return null;
    }
  };

  const getPermissions = () => {
    try {
      return JSON.parse(localStorage.getItem("permissions")) || [];
    } catch {
      return [];
    }
  };

  const hasPermission = (permission) => {
    const user = getUser();

    if (user?.role === "super_admin") return true;

    return getPermissions().includes(permission);
  };

  const roleRoutes = {
    user: [
      {
        title: "Learning",
        items: [
          {
            label: "Dashboard",
            href: "/user/dashboard",
            icon: <SpaceDashboardIcon />,
          },
          {
            label: "My Courses",
            href: "/user/courses",
            icon: <MenuBookIcon />,
          },
        ],
      },

      {
        title: "Exams",
        items: [
          {
            label: "My Exams",
            href: "/user/exams/examlist",
            icon: <QuizIcon />,
          },
        ],
      },

      {
        title: "Commerce",
        items: [
          {
            label: "My Orders",
            href: "/user/orders",
            icon: <ShoppingCartIcon />,
          },
          {
            label: "Wishlist",
            href: "/user/wishlist",
            icon: <FavoriteIcon />,
          },
          {
            label: "Cart",
            href: "/user/cart",
            icon: <ShoppingCartIcon />,
          },
        ],
      },

      {
        title: "Account",
        items: [
          {
            label: "Attendance",
            href: "/user/attendance",
            icon: <CalendarMonthIcon />,
          },
          {
            label: "Profile",
            href: "/profile",
            icon: <PersonIcon />,
          },
        ],
      },
    ],

    admin: [
      {
        title: "Academic",
        items: [
          {
            label: "Dashboard",
            href: "/admin/dashboard",
            permission: "dashboard.view",
            icon: <SpaceDashboardIcon />,
          },
          {
            label: "Courses",
            href: "/admin/courses",
            permission: "course.view",
            icon: <MenuBookIcon />,
          },
          {
            label: "Exams",
            href: "/admin/exams/examlist",
            permission: "exam.view",
            icon: <QuizIcon />,
          },
          {
            label: "Students",
            href: "/admin/students",
            permission: "student.view",
            icon: <PersonIcon />,
          },
          {
            label: "Faculty",
            href: "/admin/faculty",
            permission: "faculty.view",
            icon: <AdminPanelSettingsIcon />,
          },
          {
            label: "Attendance",
            href: "/admin/attendance",
            permission: "attendance.view",
            icon: <CalendarMonthIcon />,
          },
        ],
      },
      {
        title: "Commerce",
        items: [
          {
            label: "Orders",
            href: "/admin/orders",
            permission: "order.view",
            icon: <ShoppingCartIcon />,
          },
        ],
      },
    ],

    super_admin: [
      {
        title: "Academic",
        items: [
          {
            label: "Dashboard",
            href: "/admin/dashboard",
            icon: <SpaceDashboardIcon />,
          },
          { label: "Courses", href: "/admin/courses", icon: <MenuBookIcon /> },
          { label: "Exams", href: "/admin/exams/examlist", icon: <QuizIcon /> },
          { label: "Students", href: "/admin/students", icon: <PersonIcon /> },
          {
            label: "Faculty",
            href: "/admin/faculty",
            icon: <AdminPanelSettingsIcon />,
          },
        ],
      },
      {
        title: "Management",
        items: [
          {
            label: "Admins",
            href: "/admin/admins",
            icon: <AdminPanelSettingsIcon />,
          },
          {
            label: "Roles",
            href: "/admin/role-management",
            icon: <AssignmentAddIcon />,
          },
          {
            label: "Approvals",
            href: "/admin/approval-requests",
            icon: <AssignmentAddIcon />,
          },
        ],
      },
      {
        title: "Commerce",
        items: [
          {
            label: "Orders",
            href: "/admin/orders",
            icon: <ShoppingCartIcon />,
          },
          {
            label: "Subscription Plans",
            href: "/admin/subscription-plans",
            icon: <CardGiftcardIcon />,
          },
        ],
      },
    ],
  };

  // useEffect(() => {
  //   const loadPermissions = async () => {
  //     const res = await apiRequest(authApi.getMyPermissions, {
  //       method: "GET",
  //     });

  //     if (res.success) {
  //       setPermissions(res.data.permissions);
  //     }
  //   };

  //   loadPermissions();

  //   window.addEventListener("focus", loadPermissions);

  //   return () => {
  //     window.removeEventListener("focus", loadPermissions);
  //   };
  // }, []);

  const isAdmin =
    type === "admin" || role === "admin" || role === "super_admin";

  const getHeaderRoutes = () => {
    const sections =
      role === "super_admin"
        ? roleRoutes.super_admin
        : isAdmin
          ? roleRoutes.admin
          : roleRoutes.user;

    if (!isAdmin) return sections;

    return sections
      .map((section) => ({
        ...section,
        items: section.items.filter(
          (item) => !item.permission || hasPermission(item.permission),
        ),
      }))
      .filter((section) => section.items.length > 0);
  };

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

        const res = await apiRequest(authApi.getHomeUser, {
          method: "GET",
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

  const fetchNotifications = async () => {
    try {
      const res = await apiRequest(notificationApi.getMyNotifications, {
        method: "GET",
      });

      // Get the actual array
      const list = res?.data?.data?.data || res?.data?.data || res?.data || [];

      setNotifications(Array.isArray(list) ? list : []);
    } catch (err) {
      console.error("Notification Error:", err);
      setNotifications([]);
    }
  };

  const fetchWishlistCount = async () => {
    try {
      if (role !== "user") {
        setWishlistCount(0);
        return;
      }

      const res = await apiRequest(wishlistApi.getWishlistCount, {
        method: "GET",
      });

      if (res.success) {
        setWishlistCount(res.data?.data?.count || 0);
      }
    } catch {
      setWishlistCount(0);
    }
  };

  useEffect(() => {
    const updateWishlistCount = () => {
      if (role === "user") {
        fetchWishlistCount();
      } else {
        setWishlistCount(0);
      }
    };

    updateWishlistCount();
    window.addEventListener("wishlistUpdated", updateWishlistCount);

    return () => {
      window.removeEventListener("wishlistUpdated", updateWishlistCount);
    };
  }, [role]);

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

  const handleLogo = () => {
    router.push(isAdmin ? "/admin/dashboard" : "/");
  };

  const handleLogout = async () => {
    try {
      await apiRequest(authApi.logoutUser, {
        method: "POST",
      });
    } catch (err) {
      console.log("Logout API failed:", err.message);
    } finally {
      localStorage.clear();
      router.replace("/login");
    }
  };

  const handleNotificationClick = async (item, index) => {
    setNotifications((prev) =>
      prev.map((n, i) => (i === index ? { ...n, isRead: 1 } : n)),
    );

    if (item.notificationId) {
      await apiRequest(notificationApi.markNotificationRead, {
        method: "POST",
        data: {
          notificationId: item.notificationId,
        },
      });
    }

    setNotificationAnchor(null);

    switch (item.type) {
      case "attendance":
        router.push("/user/attendance");
        break;

      case "exam":
        if (item.examId) {
          router.push(`/user/exams/${item.examId}/start`);
        } else {
          router.push("/user/exams/examlist");
        }
        break;

      case "exam_result":
        if (item.attemptId) {
          router.push(`/user/exams/result/${item.attemptId}`);
        } else {
          router.push("/user/exams/results");
        }
        break;

      case "admin_approval":
        router.push("/admin/approval-requests");
        break;

      default:
        router.push(isAdmin ? "/admin/dashboard" : "/user/dashboard");
    }
  };

  const drawerList = (
    <Box sx={{ width: 290, p: 2 }}>
      {getHeaderRoutes().map((section) => (
        <Box key={section.title} sx={{ mb: 2 }}>
          <Typography
            sx={{
              px: 2,
              py: 1,
              color: "#6d28d9",
              fontWeight: 700,
              fontSize: 13,
              textTransform: "uppercase",
            }}
          >
            {section.title}
          </Typography>

          <List disablePadding>
            {section.items.map((item) => (
              <ListItem disablePadding key={item.href}>
                <ListItemButton
                  sx={{ borderRadius: 2 }}
                  onClick={() => {
                    setDrawerOpen(false);
                    router.push(item.href);
                  }}
                >
                  <ListItemIcon>{item.icon}</ListItemIcon>

                  <ListItemText primary={item.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider sx={{ mt: 1 }} />
        </Box>
      ))}
    </Box>
  );

  const fetchCartCount = async () => {
    try {
      if (role !== "user") {
        setCartCount(0);
        return;
      }

      const res = await apiRequest(cartApi.getCartCount, {
        method: "GET",
      });

      if (res.success) {
        setCartCount(res.data?.data?.count || res.data?.count || 0);
      }
    } catch (err) {
      console.error("Cart count fetch failed:", err);
      setCartCount(0);
    }
  };

  const loadStorage = async () => {
    try {
      const res = await apiRequest(storageApi.getStorage, {
        method: "GET",
      });

      if (res.success) {
        setStorage(res.data.data);
      }
    } catch (err) {
      console.error("Storage fetch failed:", err);
    }
  };

  useEffect(() => {
    if (type === "admin" || role === "super_admin") {
      loadStorage();
    }
  }, [type, role]);

  useEffect(() => {
    const refreshStorage = () => {
      if (type === "admin" || role === "super_admin") {
        loadStorage();
      }
    };

    window.addEventListener("storageUpdated", refreshStorage);

    return () => {
      window.removeEventListener("storageUpdated", refreshStorage);
    };
  }, [type, role]);

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

  const navigationSections = getHeaderRoutes();

  const sectionToMenu = {
    Academic: "academic",
    Learning: "learning",
    Exams: "exams",
    Commerce: "commerce",
    Account: "account",
    Management: "management",
  };

  console.log("Notifications:", notifications);

  return (
    <header className="sticky top-0 z-50 border-b bg-white shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-fit items-center gap-3">
          <div
            className="flex cursor-pointer items-center gap-2"
            onClick={handleLogo}
          >
            <GraduationCap className="h-8 w-8 text-purple-700" />
            <h1 className="text-xl font-bold text-purple-700 sm:text-2xl">
              CourseHub
            </h1>
          </div>

          <IconButton
            onClick={() => setDrawerOpen(true)}
            sx={{
              color: "#6d28d9",
              bgcolor: "#f3e8ff",
              "&:hover": { bgcolor: "#e9d5ff" },
            }}
          >
            <MenuIcon />
          </IconButton>
        </div>

        {!isMobile && (
          <Box
            sx={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Organization Admin */}
            {role !== "super_admin" && type === "admin" && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  px: 2,
                  py: 1,
                  borderRadius: 999,
                  bgcolor: "#fcfcff",
                  border: "1px solid #ede9fe",
                  minWidth: 340,
                  transition: "all .25s ease",
                  "&:hover": {
                    borderColor: "#c4b5fd",
                    boxShadow: "0 4px 10px rgba(109,40,217,.08)",
                  },
                }}
              >
                <Typography
                  sx={{
                    fontSize: 13,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  Storage
                </Typography>

                <Typography
                  sx={{
                    fontSize: 12,
                    color: "text.secondary",
                    whiteSpace: "nowrap",
                  }}
                >
                  {storage.used} / {storage.limit}
                </Typography>

                <Box
                  sx={{
                    flex: 1,
                    height: 6,
                    borderRadius: 999,
                    bgcolor: "#ececec",
                    overflow: "hidden",
                    mx: 1,
                  }}
                >
                  <Box
                    sx={{
                      width: `${Math.max(Number(storage.percentage), 2)}%`,
                      height: "100%",
                      bgcolor:
                        storage.percentage >= 90
                          ? "#ef4444"
                          : storage.percentage >= 70
                            ? "#f59e0b"
                            : "#7c3aed",
                      borderRadius: 999,
                      transition: "width .3s ease",
                    }}
                  />
                </Box>

                <Typography
                  sx={{
                    fontSize: 12,
                    fontWeight: 700,
                    color:
                      storage.percentage >= 90
                        ? "#ef4444"
                        : storage.percentage >= 70
                          ? "#f59e0b"
                          : "#6d28d9",
                    whiteSpace: "nowrap",
                  }}
                >
                  {Number(storage.percentage).toFixed(2)}%
                </Typography>
              </Box>
            )}

            {/* Super Admin Navigation */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              {navigationSections
                .filter((section) => section.items.length > 0)
                .map((section) => {
                  const menuKey = sectionToMenu[section.title];

                  if (section.items.length === 1) {
                    return (
                      <Button
                        key={section.title}
                        color="inherit"
                        onClick={() => router.push(section.items[0].href)}
                        sx={{
                          textTransform: "none",
                          borderRadius: 2,
                          px: 2,
                          fontWeight: 600,
                          "&:hover": {
                            bgcolor: "#f3e8ff",
                            color: "#6d28d9",
                          },
                        }}
                      >
                        {section.title}
                      </Button>
                    );
                  }

                  return (
                    <Button
                      key={section.title}
                      color="inherit"
                      disableRipple
                      onMouseEnter={(e) => openHoverMenu(e, menuKey)}
                      onMouseLeave={closeHoverMenu}
                      sx={{
                        textTransform: "none",
                        borderRadius: 2,
                        px: 2,
                        fontWeight: 600,
                        "&:hover": {
                          bgcolor: "#f3e8ff",
                          color: "#6d28d9",
                        },
                      }}
                      endIcon={
                        activeMenu === menuKey ? (
                          <KeyboardArrowUpIcon />
                        ) : (
                          <KeyboardArrowDownIcon />
                        )
                      }
                    >
                      {section.title}
                    </Button>
                  );
                })}
            </Box>
          </Box>
        )}

        <div className="flex min-w-fit items-center justify-end gap-2 sm:gap-3">
          <IconButton
            onClick={(e) => {
              setNotificationAnchor(e.currentTarget);
              fetchNotifications();
            }}
            className="!rounded-xl !bg-purple-100 !p-2.5 !text-purple-700 hover:!bg-purple-200"
          >
            <Badge
              badgeContent={unreadCount}
              color="error"
              invisible={unreadCount === 0}
            >
              <NotificationsIcon />
            </Badge>
          </IconButton>

          {role === "admin" && (
            <Button
              variant="contained"
              sx={{
                textTransform: "none",
                borderRadius: 3,
                background: "#6d28d9",
                mr: 1,
              }}
              startIcon={<AssignmentAddIcon />}
              onClick={(e) => setCreateAnchor(e.currentTarget)}
            >
              Create
            </Button>
          )}

          {!isAdmin && (
            <>
              <IconButton
                onClick={() => router.push("/user/wishlist")}
                className="!rounded-xl !bg-purple-100 !p-2.5 !text-purple-700 hover:!bg-purple-200"
              >
                <Badge
                  badgeContent={wishlistCount}
                  color="error"
                  invisible={wishlistCount === 0}
                >
                  <FavoriteIcon />
                </Badge>
              </IconButton>

              <IconButton
                onClick={() => router.push("/user/cart")}
                className="!rounded-xl !bg-purple-100 !p-2.5 !text-purple-700 hover:!bg-purple-200"
              >
                <Badge
                  badgeContent={cartCount}
                  color="error"
                  invisible={cartCount === 0}
                >
                  <ShoppingCartIcon />
                </Badge>
              </IconButton>
            </>
          )}

          {!isMobile && (
            <p className="hidden max-w-[160px] truncate text-sm font-medium text-gray-700 lg:block">
              Welcome,{" "}
              <span className="font-bold text-purple-700">
                {userLoading ? "Loading..." : userName}
              </span>
            </p>
          )}

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
            className="hidden rounded-xl bg-red-500 px-5 py-2 text-sm font-semibold text-white hover:bg-red-600 sm:block"
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

        {role !== "user" && (
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
        )}

        <MenuItem
          onClick={() => {
            setAnchorEl(null);
            router.push(isAdmin ? "/admin/attendance" : "/user/attendance");
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
            <CalendarCheckIcon />
          </Box>
          Attendance
        </MenuItem>

        <Divider />

        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>

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
                  const res = await apiRequest(
                    notificationApi.clearAllNotifications,
                    {
                      method: "DELETE",
                    },
                  );

                  if (res.success) {
                    setNotifications([]);
                  }
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
              onClick={() => handleNotificationClick(item, index)}
              sx={{
                alignItems: "flex-start",
                gap: 1.5,
                whiteSpace: "normal",
                bgcolor: item.isRead ? "white" : "#f3e8ff",
                "&:hover": {
                  bgcolor: "#ede9fe",
                },
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
      <Menu
        anchorEl={createAnchor}
        open={createOpen}
        onClose={() => setCreateAnchor(null)}
      >
        <MenuItem
          onClick={() => {
            router.push("/admin/add-course");
            setCreateAnchor(null);
          }}
        >
          New Course
        </MenuItem>

        <MenuItem
          onClick={() => {
            router.push("/admin/add-student");
            setCreateAnchor(null);
          }}
        >
          New Student
        </MenuItem>

        <MenuItem
          onClick={() => {
            router.push("/admin/add-faculty");
            setCreateAnchor(null);
          }}
        >
          New Faculty
        </MenuItem>

        <MenuItem
          onClick={() => {
            router.push("/admin/exams/create");
            setCreateAnchor(null);
          }}
        >
          New Exam
        </MenuItem>
      </Menu>
      <Popper
        open={hoverOpen}
        disablePortal
        anchorEl={hoverAnchor}
        transition
        placement="bottom-start"
        onMouseEnter={cancelClose}
        onMouseLeave={closeHoverMenu}
      >
        {({ TransitionProps }) => (
          <Grow
            {...TransitionProps}
            timeout={{
              enter: 180,
              exit: 120,
            }}
          >
            <Paper
              elevation={10}
              sx={{
                mt: 1,
                borderRadius: 3,
                minWidth: 230,
                overflow: "hidden",
                transformOrigin: "top left",
                transition: "all .18s ease",
              }}
            >
              <ClickAwayListener onClickAway={closeHoverMenu}>
                <MenuList autoFocusItem={false}>
                  {navigationSections
                    .find((s) => sectionToMenu[s.title] === activeMenu)
                    ?.items?.map((item) => (
                      <MenuItem
                        key={item.href}
                        onClick={() => {
                          router.push(item.href);
                          closeHoverMenu();
                        }}
                        sx={{
                          transition: "all .15s ease",
                          "&:hover": {
                            bgcolor: "#f3e8ff",
                            pl: 3,
                            color: "#6d28d9",
                          },
                        }}
                      >
                        {item.label}
                      </MenuItem>
                    ))}
                </MenuList>
              </ClickAwayListener>
            </Paper>
          </Grow>
        )}
      </Popper>
    </header>
  );
}
