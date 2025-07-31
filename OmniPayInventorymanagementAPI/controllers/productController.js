const { sql, poolPromise } = require("../config/db");
 
const getAllProducts = async (req, res) => {
  const upcc = req.params.upcc;
  try {
    const pool = await poolPromise;
    const result = await pool.request().query("SELECT * FROM Items");
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
const getProductByUPC = async (req, res) => {
  const { upc_code } = req.params;
 
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("UPC", sql.VarChar, upc_code)
      .query(`
        SELECT * FROM Items
        WHERE UPC = @UPC OR AltUPC = @UPC
      `);
 
    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
 
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching product by UPC:", err);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
 
const getAllCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query("SELECT * FROM CategoryMaster");
 
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching categories:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
const getActiveSalesTax = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .query("SELECT * FROM SalesTax WHERE IsActive = 1");
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching SalesTax:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
const getCreditCardChargeConfig = async (req, res) => {
  try {
    const pool = await poolPromise;
 
    const result = await pool.request().query(`
      SELECT CreditCardCharge
      FROM Company
      WHERE IsActive = 1
    `);
 
    if (result.recordset.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "CreditCardCharge not found" });
    }
    res.status(200).json({
      success: true,
      creditCardCharge: result.recordset[0].CreditCardCharge,
    });
  } catch (err) {
    console.error("Error fetching CreditCardCharge:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
const createProduct = async (req, res) => {
  try {
    const {
      Name,
      UPC,
      Additional_Description,
      ItemCost,
      ChargedCost,
      Sales_Tax,
      InStock,
      VendorName,
      CaseCost,
      NumberInCase,
      SalesTax,
      QuickADD,
      DroppedItem,
      EnableStockAlert,
      StockAlertLimit,
      AltUPC,
      ImageUrl,
      CategoryId,
      IsActive,
      CostPerItem,
    } = req.body;
 
    const pool = await poolPromise;
    const request = pool.request();
 
    // Bind inputs
    request.input("Name", sql.VarChar, Name);
    request.input("UPC", sql.VarChar, UPC);
    request.input(
      "Additional_Description",
      sql.VarChar,
      Additional_Description
    );
    request.input("ItemCost", sql.Decimal(12, 2), ItemCost);
    request.input("ChargedCost", sql.Decimal(12, 2), ChargedCost);
    request.input("Sales_Tax", sql.Bit, Sales_Tax);
    request.input("InStock", sql.Int, InStock);
    request.input("VendorName", sql.VarChar, VendorName);
    request.input("CaseCost", sql.Decimal(12, 2), CaseCost);
    request.input("NumberInCase", sql.Int, NumberInCase);
    request.input("SalesTax", sql.Decimal(20, 5), SalesTax);
    request.input("QuickADD", sql.Bit, QuickADD);
    request.input("DroppedItem", sql.Int, DroppedItem);
    request.input("EnableStockAlert", sql.Bit, EnableStockAlert);
    request.input("StockAlertLimit", sql.Int, StockAlertLimit);
    request.input("AltUPC", sql.VarChar, AltUPC);
    request.input("ImageUrl", sql.VarChar, ImageUrl);
    request.input("CategoryId", sql.Int, CategoryId);
    request.input("IsActive", sql.Bit, IsActive);
    request.input("CreatedDate", sql.DateTime, new Date());
    request.input("CostPerItem", sql.Decimal(18, 2), CostPerItem);
 
    // SQL query to insert and return the inserted ItemID
    const result = await request.query(`
      INSERT INTO Items (
        Name, UPC, Additional_Description, ItemCost, ChargedCost,
        Sales_Tax, InStock, VendorName, CaseCost, NumberInCase,
        SalesTax, QuickADD, DroppedItem, EnableStockAlert, StockAlertLimit,
        AltUPC, ImageUrl, CategoryId, IsActive, CreatedDate, CostPerItem
      )
      OUTPUT INSERTED.ItemID
      VALUES (
        @Name, @UPC, @Additional_Description, @ItemCost, @ChargedCost,
        @Sales_Tax, @InStock, @VendorName, @CaseCost, @NumberInCase,
        @SalesTax, @QuickADD, @DroppedItem, @EnableStockAlert, @StockAlertLimit,
        @AltUPC, @ImageUrl, @CategoryId, @IsActive, @CreatedDate, @CostPerItem
      )
    `);
 
    const insertedItemID = result.recordset[0].ItemID;
 
    res.status(201).json({
      success: true,
      message: "Product added successfully",
      ItemID: insertedItemID,
    });
  } catch (err) {
    console.error("Error inserting product:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
 
// Inventory tracking data
const getInventoryTrackingData = async (req, res) => {
  const { trackingType, productName, fromDate, toDate } = req.body;
 
  try {
    const pool = await poolPromise;
 
    const result = await pool
      .request()
      .input("p_TrackingType", sql.VarChar, trackingType)
      .input("p_ProductName", sql.VarChar, productName || null)
      .input("p_FromDate", sql.DateTime, fromDate ? new Date(fromDate) : null)
      .input("p_ToDate", sql.DateTime, toDate ? new Date(toDate) : null)
      .execute("InventoryTrackingData");
 
    if (!result.recordset || result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No tracking data found",
      });
    }
 
    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    console.error("Error fetching tracking data:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};
 
// Flash report
const getFlashReport = async (req, res) => {
  try {
    const { fromDate, toDate, invoiceNo } = req.body;
 
    let whereClause = "";
 
    //  Build dynamic WHERE clause
    if (fromDate) {
      const formattedFromDate = new Date(fromDate).toISOString().slice(0, 10); // yyyy-MM-dd
      whereClause += ` AND I.CreatedDateTime >= '${formattedFromDate}' `;
    }
 
    if (toDate) {
      const formattedToDate = new Date(toDate).toISOString().slice(0, 10);
      // Adding interval logic like DATE_ADD in MySQL, assuming SQL Server supports date + 1
      whereClause += ` AND I.CreatedDateTime < DATEADD(DAY, 1, '${formattedToDate}') `;
    }
 
    if (invoiceNo && invoiceNo.trim() !== "") {
      whereClause += ` AND I.InvoiceCode LIKE '%${invoiceNo.trim()}%' `;
    }
 
    if (whereClause.trim() === "") {
      whereClause = " AND 1=1 ";
    }
 
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("p_Where", sql.NVarChar, whereClause)
      .input("p_ItemID", sql.Int, 0)
      .execute("usp_GetSalesHistoryData_2");
 
    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (err) {
    console.error("Flash report error:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
 
// Get category by id
const getCategoryById = async (req, res) => {
  const { categoryId } = req.body;
 
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("CategoryID", sql.Int, categoryId)
      .query("SELECT * FROM Items WHERE CategoryID = @CategoryId");
 
    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }
 
    res.status(200).json({
      success: true,
      data: result.recordset[0],
    });
  } catch (err) {
    console.error("Error fetching category:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};
 
// Sales report(history)
const getSalesHistory = async (req, res) => {
  const { fromDate, toDate, paymentType, invoiceBy, invoiceCode } = req.body;
 
  try {
    const pool = await poolPromise;
 
    const result = await pool
      .request()
      .input("p_FromDate", sql.DateTime, fromDate ? new Date(fromDate) : null)
      .input("p_ToDate", sql.DateTime, toDate ? new Date(toDate) : null)
      .input("p_PaymentType", sql.VarChar(50), paymentType || null)
      .input("p_InvoiceBy", sql.VarChar(100), invoiceBy || null)
      .input("p_InvoiceCode", sql.VarChar(100), invoiceCode || null)
      .execute("sp_GetSalesReport");
 
    res.status(200).json({
      success: true,
      data: result.recordset,
    });
  } catch (error) {
    console.error("Error in getSalesReport:", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
};
 
// Hourly item report
const getHourlyReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ success: false, message: "fromDate and toDate are required." });
    }

    const formattedFromDate = new Date(fromDate).toISOString().slice(0, 10);
    const formattedToDate = new Date(toDate).toISOString().slice(0, 10);

    let whereClause = `AND I.CreatedDateTime >= '${formattedFromDate}' AND I.CreatedDateTime < DATEADD(DAY, 1, '${formattedToDate}')`;

    const pool = await poolPromise;
    const result = await pool.request()
      .input("p_Where", sql.NVarChar, whereClause)
      .input("p_ItemID", sql.Int, 0)
      .execute("usp_GetSalesHistoryData_2");

    const data = result.recordsets[0] || [];

    const hourlySummaryMap = {};
    const itemSummaryMap = {};

    for (const row of data) {
      const createdDate = row.CreatedDateTime ? new Date(row.CreatedDateTime) : null;
      const quantity = Number(row.Quantity || 0);
      const totalPrice = Number(row.TotalPrice || 0);
      const invoiceCode = row.InvoiceCode?.toString();
      const name = row.Name?.trim() || "Unknown";

      // ========== Group by Hour ==========
      if (createdDate) {
        const datePart = createdDate.toLocaleDateString('en-US');
        const hour = createdDate.getHours();

        const fromHour = hour % 12 === 0 ? 12 : hour % 12;
        const toHour = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
        const fromPeriod = hour < 12 ? "AM" : "PM";
        const toPeriod = (hour + 1) < 12 ? "AM" : "PM";

        const fromTime = `${fromHour}${fromPeriod}`;
        const toTime = `${toHour}${toPeriod}`;
        const timeSlot = `${datePart} ${fromTime} - ${toTime}`;

        if (!hourlySummaryMap[timeSlot]) {
          hourlySummaryMap[timeSlot] = {
            TimeSlot: timeSlot,
            TotalAmount: 0,
            TotalItems: 0,
            Transactions: new Set(),
          };
        }

        hourlySummaryMap[timeSlot].TotalAmount += totalPrice;
        hourlySummaryMap[timeSlot].TotalItems += quantity;
        if (invoiceCode) hourlySummaryMap[timeSlot].Transactions.add(invoiceCode);
      }

      // ========== Group by Item ==========
      if (!itemSummaryMap[name]) {
        itemSummaryMap[name] = {
          ItemName: name,
          TotalPrice: 0,
          TotalQuantity: 0,
        };
      }

      itemSummaryMap[name].TotalPrice += totalPrice;
      itemSummaryMap[name].TotalQuantity += quantity;
    }

    // Format hourly summary
    const hourlySummary = Object.values(hourlySummaryMap)
      .map(entry => ({
        TimeSlot: entry.TimeSlot,
        TotalAmount: parseFloat(entry.TotalAmount.toFixed(2)),
        TotalItems: entry.TotalItems,
        TotalTransactions: entry.Transactions.size,
      }))
      .sort((a, b) => {
        const parseTime = timeStr => {
          try {
            const [datePart, range] = timeStr.split(' ');
            const baseDate = new Date(datePart);
            const fromTime = range.split('-')[0].trim();
            const hour = new Date(`01/01/2000 ${fromTime}`).getHours();
            return new Date(baseDate.setHours(hour));
          } catch {
            return new Date(0);
          }
        };
        return parseTime(a.TimeSlot) - parseTime(b.TimeSlot);
      });

    // Format item summary
    const itemSummary = Object.values(itemSummaryMap)
      .map(entry => ({
        ItemName: entry.ItemName,
        TotalPrice: parseFloat(entry.TotalPrice.toFixed(2)),
        TotalQuantity: entry.TotalQuantity
      }))
      .sort((a, b) => b.TotalPrice - a.TotalPrice); // optional: sort by price

    res.json({
      success: true,
      hourlySummary,
      itemSummary
    });
  } catch (err) {
    console.error("Error in combined hourly report:", err);
    res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
 
// Get user coins
const getUserCoins = async (req, res) => {
  const { userCode } = req.body;
 
  if (!userCode) {
    return res.status(400).json({ error: "UserCode required" });
  }
 
  try {
    const pool = await poolPromise;
    const result = await pool.request().input("UserCode", sql.Int, userCode)
      .query(`SELECT
    u.UserCode,
    u.UserName,
    u.Name,
    u.EmailID,
    u.MobileNo,
    u.UserRole,
          CASE
        WHEN u.AvailableCoins >= 10000 THEN (u.AvailableCoins / 10000) * 5
        ELSE 0
    END AS CoinsDiscount
FROM
    Users u
WHERE
u.UserCode = @UserCode  AND  u.UserRole = 'Customer';`);
    if (result.recordset.length === 0) {
      return res.status(401).json({ error: "Invalid userCode" });
    }
    res.status(200).json({
      message: "Coins successful",
      user: result.recordset[0],
    });
  } catch (err) {
    console.error("server Error:", err);
    res.status(500).json({ error: "Server error" });
  }
};
 
 
module.exports = {
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
};
 
 
