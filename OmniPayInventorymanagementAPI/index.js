const express = require('express');
const cors = require('cors');
require('dotenv').config();
const routes = require('./routes/index');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Middleware
app.use(cors());
app.use(express.json()); 
// ✅ Routes
app.use('/api', routes);

// ✅ Root route
app.get('/', (req, res) => {
  res.send('Welcome to OmniPayInventorymanagementAPI!');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
