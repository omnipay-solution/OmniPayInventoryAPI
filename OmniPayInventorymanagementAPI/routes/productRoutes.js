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
  getHourlyReport,
  getUserCoins,
  sendDocumentEmail,
  upload, // Import multer upload middleware
  createInvoiceAndSession,
  updateCheckoutSessionStatus,
  getProductsFinalPrice,
  calculateBill,
  getProductById,
  updateProductById,
  getProductNameCategoryById,
  checkBulkPricingExists
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
router.post("/hourly-report", getHourlyReport);
router.post("/userCoins", getUserCoins);
router.post("/sendMail", upload.single('document'), sendDocumentEmail);
router.post("/create-invoiceAndSession", createInvoiceAndSession);
router.put("/update-session", updateCheckoutSessionStatus);
router.post("/final-price", getProductsFinalPrice); 
router.post("/calculate-bill", calculateBill);
router.post("/get-product", getProductById);
router.put("/update-product", updateProductById);
router.post("/get-product-name-category", getProductNameCategoryById);
router.post("/check-bulk-pricing", checkBulkPricingExists);
 



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
 
 
