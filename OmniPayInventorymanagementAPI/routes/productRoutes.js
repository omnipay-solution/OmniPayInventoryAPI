const express = require("express");
const router = express.Router();
const {
  getAllProducts,
  getProductByUPC,
  getAllCategories,
  getActiveSalesTax,
  getCreditCardChargeConfig,
  createProduct,
  getInventoryTrackingData,
  getFlashReport,
  getCategoryById,
  getSalesHistory,
  getHourlyItemReport,
  getUserCoins,
} = require("../controllers/productController");
 
// GET /products
// static routes
router.get("/categories", getAllCategories);
router.get("/sales-tax", getActiveSalesTax);
router.get("/config/creditcardcharge", getCreditCardChargeConfig);
router.post("/inventory-tracking", getInventoryTrackingData);
router.post("/flash-report", getFlashReport);
router.post("/category", getCategoryById);
router.post("/sales-history", getSalesHistory);
router.post("/hourly-report", getHourlyItemReport);
router.post("/userCoins", getUserCoins);
 
// dynamic routes
router.get("/", getAllProducts);
router.post("/", createProduct);
router.get("/:upc_code", async (req, res, next) => {
  const { upc_code } = req.params;
 
  //  Only proceed if it's a valid UPC format
  if (!/^\d{5,15}$/.test(upc_code)) {
    return res
      .status(400)
      .json({ success: false, message: "Invalid UPC format" });
  }
 
  // Call actual controller
  return getProductByUPC(req, res, next);
});
 
module.exports = router;
 
 
