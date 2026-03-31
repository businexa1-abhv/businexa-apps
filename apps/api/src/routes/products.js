/**
 * Mounted at /api/products
 *
 * Public:
 *   GET /search?q=&shopId=
 *   GET /category/:category?shopId=
 *   GET /?shopId=&page=&limit=
 *   GET /:productId
 *
 * Protected (Bearer + Mongo user):
 *   GET    /my-products
 *   POST   /              — multipart field "image" optional
 *   PUT    /:productId
 *   DELETE /:productId
 */
const express = require('express');
const multer = require('multer');
const productController = require('../controllers/productController');
const { requireAuth, requireDbUser, requireRole } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const auth = [requireAuth, requireDbUser, requireRole('seller', 'admin')];

router.get('/search', productController.search);
router.get('/category/:category', productController.byCategory);
router.get('/my-products', ...auth, productController.myProducts);
router.get('/', productController.listByShop);
router.get('/:productId', productController.getById);

router.post('/', ...auth, upload.single('image'), productController.createProduct);
router.put('/:productId', ...auth, upload.single('image'), productController.updateProduct);
router.delete('/:productId', ...auth, productController.deleteProduct);

module.exports = router;
