const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api', authRoutes);
app.use('/api', productRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to OmniPayInventorymanagementAPI!');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
