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

import { GraduationCap } from "lucide-react";

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

  const menuOpen = Boolean(anchorEl);



  useEffect(() => {
    const setUserData = (user) => {
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

      window.addEventListener("cartUpdated", fetchCartCount);

      return () => {
        window.removeEventListener("cartUpdated", fetchCartCount);
      };

      setUserEmail(user.email || "");
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
      const res = await axios.get(`${API_URL}/cart/count`, {
        withCredentials: true,
      });

      setCartCount(Number(res.data.count || 0));
    } catch (err) {
      console.log("Cart count fetch failed:", err);
    }
  };

  useEffect(() => {
    fetchCartCount();

    const updateCartCount = () => {
      fetchCartCount();
    };

    window.addEventListener("cartUpdated", updateCartCount);

    return () => {
      window.removeEventListener("cartUpdated", updateCartCount);
    };
  }, []);

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
              <button
                onClick={() => router.push("/user/orders")}
                className="font-medium text-gray-700 transition hover:text-purple-700 cursor-pointer"
              >
                My Orders
              </button>
            )}
          </nav>
        )}

        {/* RIGHT SIDE */}
        <div className="flex items-center gap-4">
          {!isAdmin && (
            <IconButton
              onClick={() => router.push("/user/cart")}
              className="!rounded-xl !bg-purple-100 !p-3 !text-purple-700 transition hover:!bg-purple-200"
            >
              <Badge badgeContent={cartCount} color="error" showZero>
                <ShoppingCartIcon className="text-purple-700" />
              </Badge>
            </IconButton>
          )}

          {!isMobile && (
            <p className="text-sm font-medium text-gray-700">
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
        <MenuItem onClick={goDashboard}>
          <Avatar sx={{ mr: 1, bgcolor: "#ede9fe", color: "#6d28d9" }} />
          Profile
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
