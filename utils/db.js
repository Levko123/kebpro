const path = require("path");
const fs = require("fs");

const adapter = process.env.DB_ADAPTER || (process.env.VERCEL ? "memory" : "sqlite");

let sqlite;
let db;
let submissionsMemory = [];
let settingsMemory = {
  notificationEmail: process.env.NOTIFICATION_EMAIL || process.env.COMPANY_EMAIL || "info@kebpro.hu",
  emailEnabled: process.env.ENABLE_EMAIL === "true",
};

if (adapter === "sqlite") {
  sqlite = require("sqlite3").verbose();
  const dbPath = process.env.DB_PATH || path.join(__dirname, "..", "data", "kebpro.sqlite");
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
  db = new sqlite.Database(dbPath);
}

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function onRun(err) {
      if (err) {
        return reject(err);
      }
      return resolve(this);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        return reject(err);
      }
      return resolve(rows);
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        return reject(err);
      }
      return resolve(row);
    });
  });
}

async function initDb() {
  if (adapter === "memory") {
    return;
  }

  await run(`
    CREATE TABLE IF NOT EXISTS submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT NOT NULL,
      company TEXT NOT NULL,
      product TEXT NOT NULL,
      quantity TEXT,
      address TEXT,
      requested_date TEXT,
      message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      notification_email TEXT NOT NULL,
      email_enabled INTEGER NOT NULL DEFAULT 0
    )
  `);

  await run(
    `
      INSERT OR IGNORE INTO app_settings (id, notification_email, email_enabled)
      VALUES (1, ?, ?)
    `,
    [process.env.NOTIFICATION_EMAIL || process.env.COMPANY_EMAIL || "info@kebpro.hu", process.env.ENABLE_EMAIL === "true" ? 1 : 0]
  );
}

async function insertSubmission(payload) {
  if (adapter === "memory") {
    const id = submissionsMemory.length + 1;
    submissionsMemory.unshift({
      id,
      type: payload.type,
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      company: payload.company,
      product: payload.product,
      quantity: payload.quantity || "",
      address: payload.address || "",
      requested_date: payload.requestedDate || "",
      message: payload.message || "",
      created_at: new Date().toISOString(),
    });
    return id;
  }

  const sql = `
    INSERT INTO submissions
      (type, name, email, phone, company, product, quantity, address, requested_date, message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const result = await run(sql, [
    payload.type,
    payload.name,
    payload.email,
    payload.phone,
    payload.company,
    payload.product,
    payload.quantity || "",
    payload.address || "",
    payload.requestedDate || "",
    payload.message || "",
  ]);

  return result.lastID;
}

async function listSubmissions(type = "all") {
  if (adapter === "memory") {
    if (type === "all") return submissionsMemory.slice(0, 300);
    return submissionsMemory.filter((row) => row.type === type).slice(0, 300);
  }

  const params = [];
  let whereClause = "";

  if (type !== "all") {
    whereClause = "WHERE type = ?";
    params.push(type);
  }

  const sql = `
    SELECT id, type, name, email, phone, company, product, quantity, address, requested_date, message, created_at
    FROM submissions
    ${whereClause}
    ORDER BY created_at DESC, id DESC
    LIMIT 300
  `;

  return all(sql, params);
}

async function getNotificationSettings() {
  if (adapter === "memory") {
    return { ...settingsMemory };
  }

  const row = await get("SELECT notification_email, email_enabled FROM app_settings WHERE id = 1");
  return {
    notificationEmail: row?.notification_email || process.env.NOTIFICATION_EMAIL || process.env.COMPANY_EMAIL,
    emailEnabled: Boolean(row?.email_enabled),
  };
}

async function updateNotificationEmail(email) {
  if (adapter === "memory") {
    settingsMemory.notificationEmail = email;
    return;
  }
  await run("UPDATE app_settings SET notification_email = ? WHERE id = 1", [email]);
}

async function setEmailEnabled(enabled) {
  if (adapter === "memory") {
    settingsMemory.emailEnabled = Boolean(enabled);
    return;
  }
  await run("UPDATE app_settings SET email_enabled = ? WHERE id = 1", [enabled ? 1 : 0]);
}

module.exports = {
  initDb,
  insertSubmission,
  listSubmissions,
  getNotificationSettings,
  updateNotificationEmail,
  setEmailEnabled,
  adapter,
};
