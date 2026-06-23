import jwt from "jsonwebtoken";

export const createLoginToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_KEY);
};

export const setAuthCookie = (res, token) => {
  res.cookie("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie("auth_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  });
};

export const deactivateOldSessions = async (db, { userId, adminId, userType }) => {
  if (userType === "admin") {
    await db.query(
      `
      UPDATE user_sessions
      SET isActive = 0, endedAt = NOW()
      WHERE adminId = ? AND userType = 'admin'
      `,
      [adminId]
    );
  }

  if (userType === "user") {
    await db.query(
      `
      UPDATE user_sessions
      SET isActive = 0, endedAt = NOW()
      WHERE userId = ? AND userType = 'user'
      `,
      [userId]
    );
  }
};

export const createUserSession = async (db, { userId, adminId, userType, token }) => {
  if (userType === "admin") {
    await db.query(
      `
      INSERT INTO user_sessions
      (adminId, userType, token, isActive, lastActivity)
      VALUES (?, 'admin', ?, 1, NOW())
      `,
      [adminId, token]
    );
  }

  if (userType === "user") {
    await db.query(
      `
      INSERT INTO user_sessions
      (userId, userType, token, isActive, lastActivity)
      VALUES (?, 'user', ?, 1, NOW())
      `,
      [userId, token]
    );
  }
};

export const endSessionByToken = async (db, token) => {
  if (!token) return;

  await db.query(
    `
    UPDATE user_sessions
    SET isActive = 0, endedAt = NOW()
    WHERE token = ?
    `,
    [token]
  );
};