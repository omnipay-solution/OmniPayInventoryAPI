// const sql = require('mssql');
// require('dotenv').config();

// const config = {
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   server: process.env.DB_SERVER, // '192.168.1.8'
//   port:parseInt(process.env.DB_PORT),
//   database: process.env.DB_DATABASE,
//   options: {
//     encrypt: false,
//     trustServerCertificate: true
//   },
//   instanceName: process.env.DB_INSTANCE,
//   port: 1433 // Explicitly specify port
// };




// console.log('Attempting to connect with config:', {
//   server: config.server,
//   port: config.port,
//   instance: config.instanceName,
//   database: config.database
// });

// const poolPromise = new sql.ConnectionPool(config)
//   .connect()
//   .then(pool => {
//     console.log('✅ SQL Server Connected');
//     return pool;
//   })
//   .catch(err => {
//     console.error('❌ Database Connection Failed:', err);
//     throw err; // Re-throw to prevent the app from starting
//   });

// module.exports = { sql, poolPromise };

const sql = require('mssql');
require('dotenv').config();
 
const connectionString = process.env.AZURE_SQL_CONNECTION_STRING;
 
console.log('Attempting to connect with Azure SQL connection string');
 
const poolPromise = new sql.ConnectionPool(connectionString)
  .connect()
  .then(pool => {
    console.log('✅ Azure SQL Server Connected');
    return pool;
  })
  .catch(err => {
    console.error('❌ Database Connection Failed:', err);
    throw err;
  });
 
module.exports = { sql, poolPromise };