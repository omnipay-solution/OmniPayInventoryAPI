const { sql, poolPromise } = require("../config/db");
const multer = require("multer");
const path = require("path");
const nodemailer = require("nodemailer");
const { fix } = require("mssql");

// Get all products--------------------------------------------------------------------------
const getAllProducts = async (req, res) => {
  const upcc = req.params.upcc;
  try {
    const pool = await poolPromise;
    const result = await pool.request().query(`SELECT 
    ItemID,
    Name,
    UPC,
    Additional_Description,
    ItemCost,
    CEILING(ChargedCost * 20) / 20 AS ChargedCost, 
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
    CreatedDate,
    CostPerItem
FROM Items
WHERE IsActive = 1`);
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Get product by UPC------------------------------------------------------------------------
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

// Get all categories------------------------------------------------------------------------
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

// Get active sales tax----------------------------------------------------------------------
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

// Get credit card charge configuration------------------------------------------------------
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

// Create a new product----------------------------------------------------------------------
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
      Pack,
      IsManual,
      BulkPricingTiers,
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
    request.input("Pack", sql.Int, Pack);
    request.input("IsManual", sql.Bit, IsManual); 

    // SQL query to insert and return the inserted ItemID
    const result = await request.query(`
      INSERT INTO Items (
        Name, UPC, Additional_Description, ItemCost, ChargedCost,
        Sales_Tax, InStock, VendorName, CaseCost, NumberInCase,
        SalesTax, QuickADD, DroppedItem, EnableStockAlert, StockAlertLimit,
        AltUPC, ImageUrl, CategoryId, IsActive, CreatedDate, CostPerItem, Pack,IsManual
      )
      OUTPUT INSERTED.ItemID
      VALUES (
        @Name, @UPC, @Additional_Description, @ItemCost, @ChargedCost,
        @Sales_Tax, @InStock, @VendorName, @CaseCost, @NumberInCase,
        @SalesTax, @QuickADD, @DroppedItem, @EnableStockAlert, @StockAlertLimit,
        @AltUPC, @ImageUrl, @CategoryId, @IsActive, @CreatedDate, @CostPerItem, @Pack, @IsManual
      )
    `);

    const insertedItemID = result.recordset[0].ItemID;

    // Insert bulk pricing tiers if provided
    if (Array.isArray(BulkPricingTiers) && BulkPricingTiers.length > 0) {
      for (const tier of BulkPricingTiers) {
        const { Quantity, Pricing, DiscountType } = tier;

        const request = pool.request();
        request.input("p_Action", sql.VarChar, "INSERT");
        request.input("p_ItemID", sql.Int, insertedItemID);
        request.input("p_BulkPricingID", sql.Int, 0);
        request.input("p_Quantity", sql.Int, Quantity);
        request.input("p_Pricing", sql.Decimal(12, 2), Pricing);
        request.input("p_DiscountType", sql.VarChar, DiscountType);
        await request.execute("BulkPricing_Crud");
      }
    }

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

// Inventory tracking data-------------------------------------------------------------------
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

// Flash report -----------------------------------------------------------------------------
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

// Get category by id------------------------------------------------------------------------
const getCategoryById = async (req, res) => {
  const { categoryId } = req.body;

  try {
    const pool = await poolPromise;
    const result = await pool.request().input("CategoryID", sql.Int, categoryId)
      .query(`SELECT 
    ItemID,
    case when IsManual = 0 then Name else Concat( Name,' - Pack - ' , pack ) end AS Name,
    UPC,
    Additional_Description,
    ItemCost,
      CAST(
    CEILING(ISNULL(ChargedCost, ItemCost) * 20) / 20.0 
    AS decimal(18,2)) AS ChargedCost,
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
    CreatedDate,
    CostPerItem,
    Pack,
    IsManual
FROM Items
WHERE IsActive = 1
  AND CategoryId = @CategoryId
ORDER BY Name;
`);

    if (result.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result.recordset, // chnaged from result.recordset[0] to return all items in the category
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

// Sales report(history)---------------------------------------------------------------------
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

// Hourly item report------------------------------------------------------------------------
const getHourlyReport = async (req, res) => {
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res
        .status(400)
        .json({ success: false, message: "fromDate and toDate are required." });
    }

    const formattedFromDate = new Date(fromDate).toISOString().slice(0, 10);
    const formattedToDate = new Date(toDate).toISOString().slice(0, 10);

    let whereClause = `AND I.CreatedDateTime >= '${formattedFromDate}' AND I.CreatedDateTime < DATEADD(DAY, 1, '${formattedToDate}')`;

    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("p_Where", sql.NVarChar, whereClause)
      .input("p_ItemID", sql.Int, 0)
      .execute("usp_GetSalesHistoryData_2");

    const data = result.recordsets[0] || []; // make changes

    const hourlySummaryMap = {};
    const itemSummaryMap = {};

    for (const row of data) {
      const createdDate = row.CreatedDateTime
        ? new Date(row.CreatedDateTime)
        : null;
      const quantity = Number(row.Quantity || 0);
      const totalPrice = Number(row.TotalPrice || 0);
      const invoiceCode = row.InvoiceCode?.toString();
      const name = row.Name?.trim() || "Unknown";

      // ========== Group by Hour ==========
      if (createdDate) {
        const datePart = createdDate.toLocaleDateString("en-US");
        const hour = createdDate.getHours();

        const fromHour = hour % 12 === 0 ? 12 : hour % 12;
        const toHour = (hour + 1) % 12 === 0 ? 12 : (hour + 1) % 12;
        const fromPeriod = hour < 12 ? "AM" : "PM";
        const toPeriod = hour + 1 < 12 ? "AM" : "PM";

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
        if (invoiceCode)
          hourlySummaryMap[timeSlot].Transactions.add(invoiceCode);
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
      .map((entry) => ({
        TimeSlot: entry.TimeSlot,
        TotalAmount: parseFloat(entry.TotalAmount.toFixed(2)),
        TotalItems: entry.TotalItems,
        TotalTransactions: entry.Transactions.size,
      }))
      .sort((a, b) => {
        const parseTime = (timeStr) => {
          try {
            const [datePart, range] = timeStr.split(" ");
            const baseDate = new Date(datePart);
            const fromTime = range.split("-")[0].trim();
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
      .map((entry) => ({
        ItemName: entry.ItemName,
        TotalPrice: parseFloat(entry.TotalPrice.toFixed(2)),
        TotalQuantity: entry.TotalQuantity,
      }))
      .sort((a, b) => b.TotalPrice - a.TotalPrice); // optional: sort by price

    res.json({
      success: true,
      hourlySummary,
      itemSummary,
    });
  } catch (err) {
    console.error("Error in combined hourly report:", err);
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
};

// Get user coins----------------------------------------------------------------------------
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

// multer setup for file upload---------------------------------------------------
const storage = multer.memoryStorage(); // Store file in memory
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Only allow specific document types
    const allowedExtensions = [
      ".pdf",
      ".doc",
      ".docx",
      ".txt",
      ".csv",
      ".xls",
      ".xlsx",
    ];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(fileExtension)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only PDF, DOC, DOCX, TXT, CSV, XLS, and XLSX files are allowed!"
        ),
        false
      );
    }
  },
});

// Function to get content type based on file extension
const getContentType = (filename) => {
  const ext = path.extname(filename).toLowerCase();
  const contentTypes = {
    ".pdf": "application/pdf",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  };

  return contentTypes[ext] || "application/octet-stream";
};

// Function to get file type category
const getFileCategory = (filename) => {
  const ext = path.extname(filename).toLowerCase();

  if ([".pdf"].includes(ext)) {
    return "PDF Document";
  } else if ([".doc", ".docx"].includes(ext)) {
    return "Word Document";
  } else if ([".txt"].includes(ext)) {
    return "Text Document";
  } else if ([".csv"].includes(ext)) {
    return "CSV File";
  } else if ([".xls", ".xlsx"].includes(ext)) {
    return "Excel Spreadsheet";
  } else {
    return "Document";
  }
};

// Send email with PDF attachment-----------------------------------------------------------
const sendDocumentEmail = async (req, res) => {
  try {
    const {
      email,
      subject = "Your Document",
      message = "Please find the attached document.",
    } = req.body;

    const documentFile = req.file; // File from multipart form
    const filename =
      req.body.filename ||
      (documentFile ? documentFile.originalname : "document");

    // Validation
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    if (!documentFile) {
      return res.status(400).json({ error: "Document file is required" });
    }
    // Get SMTP configuration from database
    const pool = await poolPromise;
    const smtpResult = await pool
      .request()
      .query("SELECT TOP 1 Host, Port, Username, Password FROM SMTPSettings");

    if (smtpResult.recordset.length === 0) {
      return res
        .status(500)
        .json({ error: "SMTP configuration not found in database" });
    }

    const { Host, Port, Username, Password } = smtpResult.recordset[0];

    // Get file details
    const fileCategory = getFileCategory(filename);
    const contentType = getContentType(filename);
    const fileSize = (documentFile.size / 1024 / 1024).toFixed(2);

    // Create transporter with database configuration
    const transporter = nodemailer.createTransport({
      host: Host,
      port: parseInt(Port, 10),
      secure: false,
      requireTLS: true,
      auth: {
        user: Username,
        pass: Password,
      },
    });

    // Get appropriate emoji for file type
    const getFileEmoji = (category) => {
      const emojis = {
        "PDF Document": "📄",
        "Word Document": "📝",
        "Text Document": "📃",
        "CSV File": "📊",
        "Excel Spreadsheet": "📊",
        Document: "📄",
      };
      return emojis[category] || "📄";
    };

    const fileEmoji = getFileEmoji(fileCategory);

    // Send email with document attachment
    await transporter.sendMail({
      from: Username,
      to: email,
      subject: subject,
      html: `
      <div style="max-width:600px; margin:0 auto; font-family:'Segoe UI', sans-serif; background-color:#f9f9f9; padding:20px; border-radius:10px; border:1px solid #ddd;">
        <h2 style="color:#333;">${fileEmoji} Your Document</h2>
        <p style="color:#555;">Hi there,</p>
        <p style="color:#555;">
          ${message}
        </p>
        <div style="background-color:#fff; padding:15px; border-radius:5px; margin:20px 0; border-left:4px solid #007bff;">
          <p style="margin:0; color:#555;">
            <strong>📎 Attachment:</strong> ${filename}
          </p>
          <p style="margin:5px 0 0 0; color:#777; font-size:14px;">
            <strong>Type:</strong> ${fileCategory} | 
            <strong>Size:</strong> ${fileSize} MB | 
            <strong>Format:</strong> ${path
              .extname(filename)
              .toUpperCase()
              .substring(1)}
          </p>
        </div>
        <p style="color:#999; font-size:14px;">
          If you have any questions or need assistance accessing this document, please don't hesitate to contact us.
        </p>
        <hr style="margin:30px 0; border:none; border-top:1px solid #ddd;">
        <p style="color:#aaa; font-size:12px; text-align:center;">
          &copy; ${new Date().getFullYear()} Omnipay Solution. All rights reserved.
        </p>
      </div>
      `,
      attachments: [
        {
          filename: filename,
          content: documentFile.buffer, // File buffer from multer
          contentType: contentType,
        },
      ],
    });

    // Respond with success message
    return res.status(200).json({
      success: true,
      message: `${fileCategory} "${filename}" sent successfully to ${email}`,
      fileDetails: {
        name: filename,
        size: `${fileSize} MB`,
        type: fileCategory,
        format: path.extname(filename).toUpperCase().substring(1),
        contentType: contentType,
      },
    });
  } catch (error) {
    console.error("Error sending document email:", error);

    // Handle multer errors
    if (
      error.message ===
      "Only PDF, DOC, DOCX, TXT, CSV, XLS, and XLSX files are allowed!"
    ) {
      return res.status(400).json({
        error: "Only PDF, DOC, DOCX, TXT, CSV, XLS, and XLSX files are allowed",
      });
    }

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        error: "File too large. Maximum size is 10MB",
      });
    }

    // Handle email errors
    if (error.code === "EAUTH") {
      return res.status(500).json({
        error:
          "Email authentication failed. Please check SMTP credentials in database",
      });
    }

    if (error.code === "ENOTFOUND") {
      return res.status(500).json({
        error:
          "SMTP server not found. Please check SMTP configuration in database",
      });
    }

    if (error.code === "ECONNECTION") {
      return res.status(500).json({
        error: "Failed to connect to SMTP server. Please check SMTP settings",
      });
    }

    return res.status(500).json({
      error: "Failed to send document email",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

// create invoice and session
// const createInvoiceAndSession = async (req, res) => {
//   const {
//     InvoiceCode,
//     UserCode,
//     SubTotal,
//     TotalTax,
//     GrandTotal,
//     CreditCardSurcharge,
//     TotalQty,
//     CreatedDateTime,
//     CoinsDiscount,
//     UserName,
//     PaymentType
//   } = req.body;

//   try {
//     const pool = await poolPromise;
//     const request = pool.request();

//     // Bind invoice inputs
//     request.input("InvoiceCode", sql.VarChar, InvoiceCode);
//     request.input("UserCode", sql.Int, UserCode);
//     request.input("SubTotal", sql.Decimal(18, 2), SubTotal || 0);
//     request.input("TotalTax", sql.Decimal(18, 2), TotalTax || 0);
//     request.input("GrandTotal", sql.Decimal(18, 2), GrandTotal || 0);
//     request.input("CreditCardSurcharge", sql.Decimal(18, 2), CreditCardSurcharge || 0);
//     request.input("TotalQty", sql.Int, TotalQty || 0);
//     request.input("CreatedDateTime", sql.DateTime, CreatedDateTime || new Date());
//     request.input("CoinsDiscount", sql.Decimal(18, 2), CoinsDiscount || 0);
//     request.input("UserName", sql.VarChar, UserName);
//     request.input("PaymentType", sql.VarChar, PaymentType);

//     // Bind checkout session inputs
//     request.input("SessionStatus", sql.VarChar, "Pending");
//     request.input("SessionCreatedAt", sql.DateTime, new Date());

//     // Transaction: Insert invoice → Insert checkout session → Return both IDs
//     const result = await request.query(`
//       BEGIN TRANSACTION;

//       DECLARE @InsertedInvoice TABLE (InvoiceId INT);

//       -- Insert into InvoiceHeader
//       INSERT INTO InvoiceHeader (
//         InvoiceCode, UserCode, SubTotal, TotalTax, GrandTotal,
//         CreditCardSurcharge, TotalQty, CreatedDateTime, CoinsDiscount,
//         UserName, PaymentType
//       )
//       OUTPUT INSERTED.InvoiceId INTO @InsertedInvoice
//       VALUES (
//         @InvoiceCode, @UserCode, @SubTotal, @TotalTax, @GrandTotal,
//         @CreditCardSurcharge, @TotalQty, @CreatedDateTime, @CoinsDiscount,
//         @UserName, @PaymentType
//       );

//       DECLARE @InvoiceId INT = (SELECT InvoiceId FROM @InsertedInvoice);
//       DECLARE @InsertedSession TABLE (SessionId INT);

//       -- Insert into CheckoutSessions
//       INSERT INTO CheckoutSessions (
//         UserCode, TotalAmount, PaidAmount, Status, CreatedAt, InvoiceId
//       )
//       OUTPUT INSERTED.SessionId INTO @InsertedSession
//       VALUES (
//         @UserCode, @GrandTotal, 0.00, @SessionStatus, @SessionCreatedAt, @InvoiceId
//       );

//       DECLARE @SessionId INT = (SELECT SessionId FROM @InsertedSession);

//       COMMIT TRANSACTION;

//       SELECT @InvoiceId AS InvoiceId, @SessionId AS SessionId;
//     `);

//     const { InvoiceId, SessionId } = result.recordset[0];

//     res.status(201).json({
//       success: true,
//       message: "Invoice and checkout session created successfully",
//       InvoiceId,
//       SessionId
//     });

//   } catch (err) {
//     console.error("Error creating Invoice and Session:", err);
//     res.status(500).json({ success: false, message: "Internal Server Error" });
//   }
// };

const createInvoiceAndSession = async (req, res) => {
  const {
    UserCode,
    SubTotal,
    TotalTax,
    GrandTotal,
    CreditCardSurcharge,
    TotalQty,
    CoinsDiscount,
    UserName,
  } = req.body;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    // Generate sequential number for InvoiceCode
    const latestResult = await pool
      .request()
      .input("UserName", sql.VarChar, UserName).query(`
      SELECT TOP 1 InvoiceCode 
      FROM InvoiceHeader 
      WHERE UserName = @UserName
      ORDER BY InvoiceId DESC
    `);

    let newInvoiceCode;
    if (latestResult.recordset.length > 0) {
      const lastCode = latestResult.recordset[0].InvoiceCode;
      const numPart = parseInt(lastCode.replace(UserName, ""), 10) || 0;
      newInvoiceCode = `${UserName}${String(numPart + 1).padStart(6, "0")}`;
    } else {
      // First invoice for this user
      newInvoiceCode = `${UserName}000001`;
    }
    // Bind invoice inputs
    request.input("InvoiceCode", sql.VarChar, newInvoiceCode);
    request.input("UserCode", sql.Int, UserCode);
    request.input("SubTotal", sql.Decimal(18, 2), SubTotal || 0);
    request.input("TotalTax", sql.Decimal(18, 2), TotalTax || 0);
    request.input("GrandTotal", sql.Decimal(18, 2), GrandTotal || 0);
    request.input(
      "CreditCardSurcharge",
      sql.Decimal(18, 2),
      CreditCardSurcharge || 0
    );
    request.input("TotalQty", sql.Int, TotalQty || 0);
    request.input("CoinsDiscount", sql.Decimal(18, 2), CoinsDiscount || 0);
    request.input("UserName", sql.VarChar, UserName);
    request.input("PaymentType", sql.VarChar, "CARD"); // static value
    request.input("SessionStatus", sql.VarChar, "Pending");
    request.input("SessionCreatedAt", sql.DateTime, new Date());

    // Transaction: Insert invoice → Insert checkout session → Return both IDs
    const result = await request.query(`
      BEGIN TRANSACTION;

      DECLARE @InsertedInvoice TABLE (InvoiceId INT);

      -- Insert into InvoiceHeader with CreatedDateTime = current date/time
      INSERT INTO InvoiceHeader (
        InvoiceCode, UserCode, SubTotal, TotalTax, GrandTotal,
        CreditCardSurcharge, TotalQty, CreatedDateTime, CoinsDiscount,
        UserName, PaymentType
      )
      OUTPUT INSERTED.InvoiceId INTO @InsertedInvoice
      VALUES (
        @InvoiceCode, @UserCode, @SubTotal, @TotalTax, @GrandTotal,
        @CreditCardSurcharge, @TotalQty, GETDATE(), @CoinsDiscount,
        @UserName, @PaymentType
      );

      DECLARE @InvoiceId INT = (SELECT InvoiceId FROM @InsertedInvoice);
      DECLARE @InsertedSession TABLE (SessionId INT);

      -- Insert into CheckoutSessions
      INSERT INTO CheckoutSessions (
        UserCode, TotalAmount, PaidAmount, Status, CreatedAt, InvoiceId
      )
      OUTPUT INSERTED.SessionId INTO @InsertedSession
      VALUES (
        @UserCode, @GrandTotal, 0.00, @SessionStatus, @SessionCreatedAt, @InvoiceId
      );

      DECLARE @SessionId INT = (SELECT SessionId FROM @InsertedSession);

      COMMIT TRANSACTION;

      SELECT @InvoiceId AS InvoiceId, @SessionId AS SessionId;
    `);

    const { InvoiceId, SessionId } = result.recordset[0];

    res.status(201).json({
      success: true,
      message: "Invoice and checkout session created successfully",
      InvoiceId,
      SessionId,
    });
  } catch (err) {
    console.error("Error creating Invoice and Session:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// update session
const updateCheckoutSessionStatus = async (req, res) => {
  const { SessionId, PaidAmount } = req.body;

  try {
    const pool = await poolPromise;
    const request = pool.request();

    // Bind inputs
    request.input("SessionId", sql.Int, SessionId);
    request.input("PaidAmount", sql.Decimal(18, 2), PaidAmount);
    request.input("Status", sql.VarChar, "Success");
    request.input("CompletedAt", sql.DateTime, new Date());

    // Update query
    await request.query(`
      UPDATE CheckoutSessions
      SET PaidAmount = @PaidAmount,
          Status = @Status,
          CompletedAt = @CompletedAt
      WHERE SessionId = @SessionId;
    `);

    res.status(200).json({
      success: true,
      message: "Checkout session updated to Success",
    });
  } catch (err) {
    console.error("Error updating CheckoutSession:", err);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Calculate final price with bulk pricing---------------------------------------------------
const getProductsFinalPrice = async (req, res) => {
  const { products, customProducts } = req.body;

    if (
    (!products || !Array.isArray(products) || products.length === 0) &&
    (!customProducts || !Array.isArray(customProducts) || customProducts.length === 0)
  ) {
    return res.status(400).json({
      success: false,
      message: "Products or customProducts array is required in request body",
    });
  }
  try {
    const pool = await poolPromise;
    const responseData = [];

    // 1. Handle Normal Products
    if (products && Array.isArray(products)) {
      for (let p of products) {
        const { ItemID, Qty, Discount = 0 } = p;

        const itemResult = await pool
          .request()
          .input("ItemID", sql.Int, ItemID)
          .query(
            `SELECT ItemID, Name, Convert(decimal(18,0),ISNULL(ChargedCost, ItemCost)) AS ChargedCost 
            FROM Items WHERE ItemID = @ItemID`
          );

        if (itemResult.recordset.length === 0) {
          responseData.push({
            ItemID,
            Qty,
            error: "Item not found",
          });
          continue;
        }

        const item = itemResult.recordset[0];

        // Bulk Pricing
        const bulkResult = await pool
          .request()
          .input("ItemID", sql.Int, ItemID)
          .input("Qty", sql.Int, Qty).query(`
            SELECT TOP 1 Quantity, Pricing, DiscountType
            FROM BulkPricing
            WHERE ItemID = @ItemID AND Quantity = @Qty
            ORDER BY Quantity DESC
          `);
 
          let finalUnitPrice = item.ChargedCost;
          let bulkApplied = false;
          // console.log("unit price" ,item.ChargedCost)

        if (bulkResult.recordset.length > 0) {
          const appliedTier = bulkResult.recordset[0];
          bulkApplied = true;

          if (appliedTier.DiscountType === "$") {
            finalUnitPrice = appliedTier.Pricing;
          } else if (appliedTier.DiscountType === "%") {
            taxCount = (item.ChargedCost * appliedTier.Pricing) / 100; // per unit discount
            finalUnitPrice = item.ChargedCost - taxCount;
            totalBUlkDiscount = taxCount * Qty;
          }
        }

        let lineTotal = finalUnitPrice * Qty;
        // console.log("line total" , lineTotal);
 
        // console.log("Discount" , Discount);
        // Apply Discount (only for DB products)
        if (!bulkApplied && Discount && Discount.Value > 0) {
          if (Discount.Type === "%") {
            lineTotal = lineTotal - (lineTotal * Discount.Value) / 100;
          } else if (Discount.Type === "$") {
            lineTotal = lineTotal - Discount.Value;
          }
        }
        // console.log("final total" , lineTotal);

        responseData.push({
          ItemID: item.ItemID,
          ItemName: item.Name,
          Qty,
          UnitPrice: item.ChargedCost,
          Discount:  bulkApplied ?  { Type: "Bulk", Value: parseFloat(totalBUlkDiscount.toFixed(2)) } : Discount,
          BulkApplied : bulkApplied,
          FinalPrice: parseFloat(lineTotal.toFixed(2)),
        });
      }
    }

    // 2. Handle Custom Products
    if (customProducts && Array.isArray(customProducts)) {
      // Fetch company tax % once
      const companyTaxResult = await pool
        .request()
        .query("SELECT TOP 1 SalesTax FROM Company");
        console.log("companyTaxResult", companyTaxResult);

      const companyTaxRate = companyTaxResult.recordset.length
        ? parseFloat(companyTaxResult.recordset[0].SalesTax) || 0
        : 0;
        console.log("companyTaxRate", companyTaxRate);

      for (let c of customProducts) {
        const { Name, Qty, UnitPrice, Taxable } = c;

        let lineTotal = Qty * UnitPrice;
        let taxAmount = 0;

        if (Taxable) {
          taxAmount = (lineTotal * companyTaxRate) / 100;
          console.log("taxAmount", taxAmount);
          // fixedTaxAmount = Math.round(taxAmount); 
          // console.log("fixedTaxAmount", fixedTaxAmount);
          lineTotal += taxAmount;
        }
        console.log("custom product line total", lineTotal);

        responseData.push({
          ItemID: 0,
          ItemName: Name,
          Qty,
          UnitPrice,
          Taxable,
          TaxRate: Taxable ? companyTaxRate : 0,
          TaxAmount: parseFloat(taxAmount.toFixed(2)),
          FinalPrice: parseFloat(lineTotal.toFixed(2)),
        });
      }
    }

    // Final Response
    res.status(200).json({
      success: true,
      data: responseData,
    });
  } catch (err) {
    console.error("Error calculating final price:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Calculate bill with subtotal, coins discount, tax, and total--------------------------------
const calculateBill = async (req, res) => {
  const { items, UserCode } = req.body;
  // items = [{ ItemID, Qty, UnitPrice, FinalPrice }]

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Items array is required",
    });
  }

  try {
    const pool = await poolPromise;

    // 1. Subtotal from final price
    let subtotal = items.reduce((acc, item) => acc + (item.FinalPrice || 0), 0);

    let coinsDiscount = 0;

    // 2. If user is passed, calculate discount
    if (UserCode) {
      const userResult = await pool
        .request()
        .input("UserCode", sql.Int, UserCode).query(`
          SELECT 
              u.UserCode,
              u.AvailableCoins,
              CASE
                WHEN u.AvailableCoins >= 10000 THEN (u.AvailableCoins / 10000) * 5
                ELSE 0
              END AS CoinsDiscount
          FROM Users u
          WHERE u.UserCode = @UserCode AND u.UserRole = 'Customer'
        `);

      if (userResult.recordset.length > 0) {
        coinsDiscount = userResult.recordset[0].CoinsDiscount;
      }
    }

    // 3. Calculate taxable amount
    const taxableAmount = subtotal - coinsDiscount;

    // 4. Fetch tax rate from Company table
    const tax = await pool
      .request()
      .query(`SELECT SalesTax from Company where isActive = 1`);
    const taxRate =
      tax.recordset.length > 0 ? tax.recordset[0].SalesTax : 6.625; // Default to 6.625% if not found
    const taxAmount = (taxableAmount * taxRate) / 100;

    // 5. Total
    const total = taxableAmount + taxAmount;

    res.status(200).json({
      success: true,
      summary: {
        Subtotal: subtotal,
        CoinsDiscount: coinsDiscount,
        Tax: taxAmount,
        Total: total,
      },
    });
  } catch (err) {
    console.error("Error calculating bill:", err);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
      error: err.message,
    });
  }
};

// Get product by id--------------------------------------------------------------------------
const getProductById = async (req, res) => {
  let pool, transaction;
  try {
    const { ItemID } = req.body;

    if (!ItemID) {
      return res.status(400).json({ error: "ItemID is required" });
    }

    pool = await poolPromise;
    transaction = new sql.Transaction(pool);

    // Start transaction
    await transaction.begin();

    const request = new sql.Request(transaction);
    request.input("ItemID", sql.Int, ItemID);

    // Query 1: Get product details
    const productResult = await request.query(`
      SELECT 
          ItemID,
          case when IsManual = 0 then Name else Concat(Name,' - Pack - ' , pack ) end as Name,
          UPC,
          Additional_Description,
          ItemCost,
          CAST(CEILING(ISNULL(ChargedCost, ItemCost) * 20) / 20.0 AS decimal(18,2)) AS ChargedCost,
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
          Pack,
          IsManual
      FROM Items
      WHERE ItemID = @ItemID
    `);

    if (productResult.recordset.length === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "Item not found" });
    }

    // Query 2: Get bulk pricing tiers for this item
    const bulkPricingResult = await request.query(`
      SELECT 
          Quantity,
          Pricing,
          DiscountType
      FROM BulkPricing
      WHERE ItemID = @ItemID
      ORDER BY Quantity
    `);

    // Commit transaction since both queries succeeded
    await transaction.commit();

    // Combine results
    const product = {
      ...productResult.recordset[0],
      BulkPricing: bulkPricingResult.recordset || [],
    };

    res.json(product);
  } catch (err) {
    console.error("Error fetching item:", err);

    if (transaction) {
      try {
        await transaction.rollback();
      } catch (rollbackErr) {
        console.error("Rollback error:", rollbackErr);
      }
    }

    res.status(500).json({ error: "Server error" });
  }
};

// Update product by id--------------------------------------------------------------------------
const updateProductById = async (req, res) => {
  let transaction; // for safe rollback

  try {
    const {
      ItemID,
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
      UpdatedBy,
      Pack,
      IsManual,
      BulkPricingTiers,
    } = req.body;

    if (!ItemID) {
      return res.status(400).json({ error: "ItemID is required" });
    }

    // ✅ Await the pool and pass the real pool to Transaction
    const pool = await poolPromise;
    transaction = new sql.Transaction(pool);
    await transaction.begin();

    const request = new sql.Request(transaction);

    request.input("ItemID", sql.Int, ItemID);
    request.input("Name", sql.VarChar(255), Name);
    request.input("UPC", sql.VarChar(50), UPC);
    request.input(
      "Additional_Description",
      sql.VarChar(sql.MAX),
      Additional_Description
    );
    request.input("ItemCost", sql.Decimal(12, 2), ItemCost);
    request.input("ChargedCost", sql.Decimal(12, 2), ChargedCost);
    request.input("Sales_Tax", sql.Decimal(12, 2), Sales_Tax);
    request.input("InStock", sql.Int, InStock);
    request.input("VendorName", sql.VarChar(255), VendorName);
    request.input("CaseCost", sql.Decimal(12, 2), CaseCost);
    request.input("NumberInCase", sql.Int, NumberInCase);
    request.input("SalesTax", sql.Decimal(12, 2), SalesTax);
    request.input("QuickADD", sql.Bit, QuickADD);
    request.input("DroppedItem", sql.Bit, DroppedItem);
    request.input("EnableStockAlert", sql.Bit, EnableStockAlert);
    request.input("StockAlertLimit", sql.Int, StockAlertLimit);
    request.input("AltUPC", sql.VarChar(50), AltUPC);
    request.input("ImageUrl", sql.VarChar(sql.MAX), ImageUrl);
    request.input("CategoryId", sql.Int, CategoryId);
    request.input("IsActive", sql.Bit, IsActive);
    request.input("CostPerItem", sql.Decimal(12, 2), CostPerItem);
    request.input("UpdatedBy", sql.NVarChar(100), UpdatedBy);
    request.input("Pack", sql.Int, Pack);
    request.input("IsManual", sql.Bit, IsManual);

    await request.query(`
      UPDATE Items
      SET 
        Name = @Name,
        UPC = @UPC,
        Additional_Description = @Additional_Description,
        ItemCost = @ItemCost,
        ChargedCost = @ChargedCost,
        Sales_Tax = @Sales_Tax,
        InStock = @InStock,
        VendorName = @VendorName,
        CaseCost = @CaseCost,
        NumberInCase = @NumberInCase,
        SalesTax = @SalesTax,
        QuickADD = @QuickADD,
        DroppedItem = @DroppedItem,
        EnableStockAlert = @EnableStockAlert,
        StockAlertLimit = @StockAlertLimit,
        AltUPC = @AltUPC,
        ImageUrl = @ImageUrl,
        CategoryId = @CategoryId,
        IsActive = @IsActive,
        CostPerItem = @CostPerItem,
        UpdatedAt = GETDATE(),
        UpdatedBy = @UpdatedBy,
        Pack = @Pack,
        IsManual = @IsManual
      WHERE ItemID = @ItemID
    `);

    // BulkPricing: delete + insert (your current approach)
    if (Array.isArray(BulkPricingTiers)) {
      await new sql.Request(transaction)
        .input("ItemID", sql.Int, ItemID)
        .query(`DELETE FROM BulkPricing WHERE ItemID = @ItemID`);

      for (const tier of BulkPricingTiers) {
        await new sql.Request(transaction)
          .input("ItemID", sql.Int, ItemID)
          .input("Quantity", sql.Int, tier.Quantity)
          .input("Pricing", sql.Decimal(12, 2), tier.Pricing)
          .input("DiscountType", sql.VarChar(5), tier.DiscountType).query(`
            INSERT INTO BulkPricing (ItemID, Quantity, Pricing, DiscountType)
            VALUES (@ItemID, @Quantity, @Pricing, @DiscountType)
          `);
      }
    }

    await transaction.commit();
    res.json({ message: "Item and BulkPricing updated successfully" });
  } catch (err) {
    console.error("Error updating item:", err);
    try {
      if (transaction) await transaction.rollback();
    } catch (_) {}
    res.status(500).json({ error: "Server error" });
  }
};

// get productname and itemID By categoryID------------------------------------------------
const getProductNameCategoryById = async (req, res) => {
  try {
    const { CategoryId } = req.body;

    if (!CategoryId) {
      return res.status(400).json({ error: "CategoryId is required" });
    }
    const pool = await poolPromise;
    const request = pool.request();
    request.input("CategoryId", sql.Int, CategoryId);
    const result = await request.query(`
        SELECT ItemID, Name 
        FROM Items 
        WHERE CategoryId = @CategoryId AND IsActive = 1
        ORDER BY Name
      `);
    res.json({ products: result.recordset });
  } catch (err) {
    console.error("Error fetching products by category:", err);
    res.status(500).json({ error: "Server error" });
  }
};

// check if bulk pricing exists for an item ---------------------------------------------------
const checkBulkPricingExists = async (req, res) => {
  try {
    const { ItemID, Qty } = req.body;
    if (!ItemID || !Qty) {
      return res.swtatus(400).json({ error: "ItemID and Qty are required" });
    }
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input("ItemID", sql.Int, ItemID)
      .input("Qty", sql.Int, Qty)
      .query(
        "SELECT COUNT(BulkPricingID) AS Count FROM BulkPricing WHERE ItemID = @ItemID AND Quantity = @Qty"
      );

    const count = result.recordset[0].Count;
    if (count > 0) {
      return res.json({
        success: true,
        BulkPricing: true,
      });
    } else {
      return res.json({
        success: true,
        BulkPricing: false,
      });
    }
  } catch (err) {
    console.error("Error checking bulk pricing:", err);
    return false;
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
  sendDocumentEmail,
  upload, // Export multer upload middleware
  getContentType,
  createInvoiceAndSession,
  updateCheckoutSessionStatus,
  getProductsFinalPrice,
  calculateBill,
  getProductById,
  updateProductById,
  getProductNameCategoryById,
  checkBulkPricingExists,
};
