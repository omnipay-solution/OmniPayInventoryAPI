
const express = require('express');
const router = express.Router();
const { getAllProducts, getProductByUPC , getAllCategories, getActiveSalesTax, getCreditCardChargeConfig, createProduct} = require('../controllers/productController');

// GET /products
router.get('/products', getAllProducts);
router.get('/products/:upc_code', getProductByUPC);
router.get('/categories', getAllCategories);
router.get('/sales-tax', getActiveSalesTax);
router.get('/config/creditcardcharge', getCreditCardChargeConfig);
router.post('/products', createProduct);

module.exports = router;