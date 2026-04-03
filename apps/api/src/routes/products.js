/**
 * Mounted at /api/products
 *
 * Public:
 *   GET /search?q=&shopId=
 *   GET /category/:category?shopId=
 *   GET /browse?category=&page=&limit= — catalog across shops
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
const { requireAuth, requireDbUser, requireRole, optionalAuthLenient } = require('../middleware/authMiddleware');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

const auth = [requireAuth, requireDbUser, requireRole('seller', 'admin')];

router.get('/search', optionalAuthLenient, productController.search);
router.get('/category/:category', optionalAuthLenient, productController.byCategory);
router.get('/browse', optionalAuthLenient, productController.browsePublic);
router.get('/my-products', ...auth, productController.myProducts);
router.get('/', optionalAuthLenient, productController.listByShop);
router.get('/:productId', optionalAuthLenient, productController.getById);

router.post('/', ...auth, upload.single('image'), productController.createProduct);
router.put('/:productId', ...auth, upload.single('image'), productController.updateProduct);
router.delete('/:productId', ...auth, productController.deleteProduct);

module.exports = router;
