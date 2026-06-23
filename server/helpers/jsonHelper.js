export const safeJSON = (value, fallback = []) => {
  if (!value) return fallback;
  if (Array.isArray(value)) return value;
  if (typeof value !== "string") return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

export const stringifyJSON = (value) => {
  return JSON.stringify(value ?? null);
};