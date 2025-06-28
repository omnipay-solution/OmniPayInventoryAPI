// db.js
const sql = require('mssql');
require('dotenv').config();

const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;

console.log('Attempting to connect with Azure SQL connection string...');

const poolPromise = new sql.ConnectionPool(connectionString)
  .connect()
  .then(pool => {
    console.log('✅ Azure SQL Server Connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database Connection Failed:', err.message);
    throw err;
  });

module.exports = {
  sql,
  poolPromise
};
