const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ✅ Middleware
app.use(cors());
app.use(express.json()); // replaces body-parser


app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Routes
app.use('/api', authRoutes);
app.use('/api', productRoutes);


// ✅ Root route
app.get('/', (req, res) => {
  res.send('Welcome to OmniPayInventorymanagementAPI!');
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
