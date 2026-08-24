const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const   { VerifyToken , VerifyRole , VerifyAdmin} = require('../middlewares/VerifyToken');



router.post('/' ,VerifyToken,VerifyAdmin,
        CategoryController.CreateCategory);

router.get('/' ,VerifyToken, 
        CategoryController.GetAllCategory);

router.get('/:id' ,VerifyToken,
        CategoryController.getCategoryById);

router.put('/:id' ,VerifyToken,VerifyAdmin,
        CategoryController.UpdateCategory);

router.put('/:id' ,VerifyToken,VerifyAdmin,
        CategoryController.DeleteCategory);

        
module.exports = router;



