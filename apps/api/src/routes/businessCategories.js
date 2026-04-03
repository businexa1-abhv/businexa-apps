const express = require('express');
const businessCategoriesController = require('../controllers/businessCategoriesController');

const router = express.Router();
router.get('/', businessCategoriesController.list);

module.exports = router;
