const express = require('express');
const router = express.Router();
const {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} = require('../controllers/productController');
const { verifyToken, checkAccess } = require('../middleware/authMiddleware');

// Before: router.route('/').get(protect, getProducts)...
// After: router.route('/').get(verifyToken, checkAccess('products'), getProducts)...

router.route('/')
  .get(verifyToken, checkAccess('products'), getProducts)
  .post(verifyToken, checkAccess('products'), createProduct);

router.route('/:id')
  .put(verifyToken, checkAccess('products'), updateProduct)
  .delete(verifyToken, checkAccess('products'), deleteProduct);

module.exports = router;
