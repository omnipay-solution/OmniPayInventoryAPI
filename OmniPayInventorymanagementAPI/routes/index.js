const express = require('express');
const router = express.Router();

const authController = require('./authRoutes');
const productController = require('./productRoutes');

// Authentication routes
router.use('/auth', authController);
// Product routes
router.use('/products', productController);

module.exports = router;


