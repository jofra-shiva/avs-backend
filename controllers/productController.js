const Product = require('../models/Product');
const ProductionTarget = require('../models/ProductionTarget');
const Production = require('../models/Production');

// @desc    Get all products
// @route   GET /api/products
// @access  Private
const getProducts = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: { $ne: true } });
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create product(s)
// @route   POST /api/products
// @access  Private
const createProduct = async (req, res) => {
  try {
    const handleProduct = async (data) => {
      // Check if a soft-deleted product with this SKU already exists
      const existing = await Product.findOne({ sku: data.sku, isDeleted: true });
      if (existing) {
        // Restore and update existing record
        Object.assign(existing, data, { isDeleted: false });
        return await existing.save();
      }
      return await Product.create(data);
    };

    if (Array.isArray(req.body)) {
      const results = [];
      for (const item of req.body) {
        results.push(await handleProduct(item));
      }
      res.status(201).json(results);
    } else {
      const product = await handleProduct(req.body);
      res.status(201).json(product);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private
const updateProduct = async (req, res) => {
  try {
    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (updatedProduct) {
      res.json(updatedProduct);
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    
    if (product) {
      const productName = product.name;
      const productSize = product.size;
      const productSku = product.sku;

      // Soft delete the product
      product.isDeleted = true;
      await product.save();

      // Soft delete related Production Targets (Production Plan)
      await ProductionTarget.updateMany(
        { 
          $or: [
            { sku: productSku },
            { productName: productName, productSize: productSize }
          ]
        },
        { $set: { isDeleted: true } }
      );

      // Soft delete related Production Records (Daily production)
      await Production.updateMany(
        { product: productName, size: productSize },
        { $set: { isDeleted: true } }
      );

      res.json({ message: 'Product and related operational records removed (soft-deleted)' });
    } else {
      res.status(404).json({ message: 'Product not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reset all product initial stocks to 0
// @route   POST /api/products/reset-stocks
// @access  Private
const resetAllStocks = async (req, res) => {
  try {
    await Product.updateMany({}, { $set: { stock: 0 } });
    res.json({ message: 'All product stocks reset to 0' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  resetAllStocks,
};
