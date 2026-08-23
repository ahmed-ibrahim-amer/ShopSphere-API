const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');
const   { VerifyToken , VerifyRole , VerifyAdmin} = require('../middlewares/VerifyToken');

router.post('/CreateProduct',VerifyToken,VerifyAdmin,ProductController.createProduct);
router.get('/',VerifyToken,ProductController.GetAllProducts);

module.exports = router;