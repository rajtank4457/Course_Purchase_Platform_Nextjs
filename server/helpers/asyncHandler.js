export const asyncHandler = (fn) => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      console.error("SERVER ERROR:", err);

      return res.status(500).json({
        success: false,
        message: "Server Error",
        error: err.message,
      });
    }
  };
};