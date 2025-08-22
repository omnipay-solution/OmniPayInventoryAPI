// controllers/authController.js
const { poolPromise, sql } = require('../config/db');

// login
const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request()
      .input('username', sql.VarChar, username)
      .input('password', sql.VarChar, password)
      .query(`SELECT * FROM Users WHERE Username = @username AND Password = @password AND UserRole not in ('Customer')`);

    const user = result.recordset[0];

    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        LUserCode: user.UserCode,
        UserName: user.UserName,
        UserRole: user.UserRole,
        IsAdmin: user.IsAdmin
      }
    });

  } catch (err) {
    console.error('❌ Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login
};
