import { sendError } from "./responseHelper.js";

export const requireAdmin = (req, res) => {
  if (req.userType !== "admin") {
    sendError(res, "Only admins can access this resource", 403);
    return false;
  }

  return true;
};

export const requireUser = (req, res) => {
  if (req.userType !== "user") {
    sendError(res, "Only users can access this resource", 403);
    return false;
  }

  return true;
};