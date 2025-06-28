
const { sql, poolPromise } = require('../config/db');

const getAllProducts = async (req, res) => {
  const upcc = req.params.upcc;
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM Items');
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Error fetching products:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getProductByUPC = async (req, res) => {
  const { upc_code } = req.params;

  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('UPC', sql.VarChar, upc_code)
      .query(`
        SELECT * FROM Items
        WHERE UPC = @UPC OR AltUPC = @UPC
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('Error fetching product by UPC:', err);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

const getAllCategories = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM CategoryMaster');
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Error fetching categories:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getActiveSalesTax = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool.request().query('SELECT * FROM SalesTax WHERE IsActive = 1');
    res.status(200).json({ success: true, data: result.recordset });
  } catch (err) {
    console.error('❌ Error fetching SalesTax:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const getCreditCardChargeConfig = async (req, res) => {
  try {
    const pool = await poolPromise;
    const result = await pool
      .request()
      .input('configKey', sql.VarChar, 'CreditCardCharge')
      .query('SELECT TOP 1 * FROM Config WHERE [Key] = @configKey');

    if (result.recordset.length === 0) {
      return res.status(404).json({ success: false, message: 'Config not found' });
    }

    res.status(200).json({ success: true, data: result.recordset[0] });
  } catch (err) {
    console.error('❌ Error fetching Config:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

const createProduct = async (req, res) => {
  try {
    const {
      Name,
      Category,
      UPC,
      Additional_Description,
      ItemCost,
      ChargedCost,
      Sales_Tax,
      InStock,
      VendorPartNum,
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
      CostPerItem
    } = req.body;

    const pool = await poolPromise;
    const request = pool.request();

    // Bind inputs
    request.input('Name', sql.VarChar, Name);
    request.input('Category', sql.VarChar, Category);
    request.input('UPC', sql.VarChar, UPC);
    request.input('Additional_Description', sql.VarChar, Additional_Description);
    request.input('ItemCost', sql.Decimal(12, 2), ItemCost);
    request.input('ChargedCost', sql.Decimal(12, 2), ChargedCost);
    request.input('Sales_Tax', sql.Bit, Sales_Tax);
    request.input('InStock', sql.Int, InStock);
    request.input('VendorPartNum', sql.VarChar, VendorPartNum);
    request.input('VendorName', sql.VarChar, VendorName);
    request.input('CaseCost', sql.Decimal(12, 2), CaseCost);
    request.input('NumberInCase', sql.Int, NumberInCase);
    request.input('SalesTax', sql.Decimal(20, 5), SalesTax);
    request.input('QuickADD', sql.Bit, QuickADD);
    request.input('DroppedItem', sql.Int, DroppedItem);
    request.input('EnableStockAlert', sql.Bit, EnableStockAlert);
    request.input('StockAlertLimit', sql.Int, StockAlertLimit);
    request.input('AltUPC', sql.VarChar, AltUPC);
    request.input('ImageUrl', sql.VarChar, ImageUrl);
    request.input('CategoryId', sql.Int, CategoryId);
    request.input('IsActive', sql.Bit, IsActive);
    request.input('CreatedDate', sql.DateTime, new Date());
    request.input('CostPerItem', sql.Decimal(18, 2), CostPerItem);

    // SQL query to insert and return the inserted ItemID
    const result = await request.query(`
      INSERT INTO Items (
        Name, Category, UPC, Additional_Description, ItemCost, ChargedCost,
        Sales_Tax, InStock, VendorPartNum, VendorName, CaseCost, NumberInCase,
        SalesTax, QuickADD, DroppedItem, EnableStockAlert, StockAlertLimit,
        AltUPC, ImageUrl, CategoryId, IsActive, CreatedDate, CostPerItem
      )
      OUTPUT INSERTED.ItemID
      VALUES (
        @Name, @Category, @UPC, @Additional_Description, @ItemCost, @ChargedCost,
        @Sales_Tax, @InStock, @VendorPartNum, @VendorName, @CaseCost, @NumberInCase,
        @SalesTax, @QuickADD, @DroppedItem, @EnableStockAlert, @StockAlertLimit,
        @AltUPC, @ImageUrl, @CategoryId, @IsActive, @CreatedDate, @CostPerItem
      )
    `);

    const insertedItemID = result.recordset[0].ItemID;

    res.status(201).json({
      success: true,
      message: '✅ Product added successfully',
      ItemID: insertedItemID
    });

  } catch (err) {
    console.error('❌ Error inserting product:', err);
    res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};


module.exports = { getAllProducts, getProductByUPC , getAllCategories, getActiveSalesTax, getCreditCardChargeConfig, createProduct};