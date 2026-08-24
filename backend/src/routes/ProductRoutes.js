const express = require('express');
const router = express.Router();
const ProductController = require('../controllers/ProductController');

const   { VerifyToken , VerifyRole , VerifyAdmin} = require('../middlewares/VerifyToken');

router.post('/'
    ,VerifyToken,VerifyAdmin,ProductController.createProduct);

router.get('/',
    VerifyToken,ProductController.GetAllProducts);

router.get('/:id',
    VerifyToken,ProductController.GetProductById);    

router.put('/:id',
    VerifyToken,VerifyAdmin,ProductController.UpdateProduct);

router.delete('/:id',
    VerifyToken,VerifyAdmin,ProductController.DeleteProduct);

module.exports = router;