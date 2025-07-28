// config/db.js
const sql = require("mssql");
require("dotenv").config();

const config = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT) || 1433, // Default port for MSSQL
  database: process.env.DB_DATABASE,
  options: {
    encrypt: false, 
    trustServerCertificate: true, // For local dev/test
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

const poolPromise = new sql.ConnectionPool(config)
  .connect()
  .then((pool) => {
    console.log("✅ Database Connected Successfully");
    return pool;
  })
  .catch((err) => {
    console.error("❌ Database Connection Failed:", err.message);
    throw err;
  });

module.exports = { sql, poolPromise };

