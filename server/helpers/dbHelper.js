import { connectToDatabase } from "../lib/db.js";

export const getDb = async () => {
  return await connectToDatabase();
};

export const runQuery = async (sql, params = []) => {
  const db = await connectToDatabase();
  const [result] = await db.query(sql, params);
  return result;
};

export const findOne = async (sql, params = []) => {
  const rows = await runQuery(sql, params);
  return rows[0] || null;
};

export const insertRow = async (table, data) => {
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new Error("insertRow data cannot be empty");
  }

  const values = Object.values(data);

  const sql = `
    INSERT INTO ${table}
    (${keys.join(", ")})
    VALUES (${keys.map(() => "?").join(", ")})
  `;

  return await runQuery(sql, values);
};

export const updateRow = async (table, data, whereSql, whereParams = []) => {
  const keys = Object.keys(data);

  if (keys.length === 0) {
    throw new Error("updateRow data cannot be empty");
  }

  const values = Object.values(data);

  const sql = `
    UPDATE ${table}
    SET ${keys.map((key) => `${key} = ?`).join(", ")}
    WHERE ${whereSql}
  `;

  return await runQuery(sql, [...values, ...whereParams]);
};

export const deleteRow = async (table, whereSql, whereParams = []) => {
  return await runQuery(
    `DELETE FROM ${table} WHERE ${whereSql}`,
    whereParams
  );
};

export const existsById = async (table, idColumn, idValue) => {
  const row = await findOne(
    `SELECT ${idColumn} FROM ${table} WHERE ${idColumn} = ? LIMIT 1`,
    [idValue]
  );

  return !!row;
};