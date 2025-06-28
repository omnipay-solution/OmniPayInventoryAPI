// models/userModel.js
const { poolPromise, sql } = require('../config/db');

async function getUserByUsernameAndPassword(username, password) {

  try {

    const pool = await poolPromise;

    const result = await pool.request()

      .input('username', sql.VarChar, username)

      .input('password', sql.VarChar, password)

      .query('SELECT * FROM Users WHERE Username = @username AND Password = @password');

console.log(result.recordset);

    return result.recordset[0];

  } catch (err) {

    console.error('❌ SQL Error:', err);

    throw err;

  }

}
 

module.exports = {
  getUserByUsernameAndPassword
};
