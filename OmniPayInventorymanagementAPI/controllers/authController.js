// controllers/authController.js
const User = require('../models/userModel');

const login = async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.getUserByUsernameAndPassword(username, password);
   
    if (!user) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }

    res.json({
      message: 'Login successful',
      user: {
        UserCode: user.UserCode,
        UserName: user.UserName,
        UserRole: user.UserRole,
        IsAdmin: user.IsAdmin
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  login
};
