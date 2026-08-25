const express = require('express');
const router = express.Router();
const CategoryController = require('../controllers/categoryController');
const   { VerifyToken , VerifyRole , VerifyAdmin} = require('../middlewares/VerifyToken');

/**
 * @swagger
 * /Category:
 *   post:
 *     summary: Create new category
 *     tags: [Category]
 *     responses:
 *       201:
 *         description: Create new category returned successfully
 */
router.post('/' ,VerifyToken,VerifyAdmin,
        CategoryController.CreateCategory);
/**
 * @swagger
 * /Category:
 *   get:
 *     summary: Get all categories
 *     tags: [Category]
 *     responses:
 *       200:
 *         description: List of categories returned successfully
 */
router.get('/' ,VerifyToken, 
        CategoryController.GetAllCategory);

router.get('/:id' ,VerifyToken,
        CategoryController.getCategoryById);

router.put('/:id' ,VerifyToken,VerifyAdmin,
        CategoryController.UpdateCategory);

router.delete('/:id' ,VerifyToken,VerifyAdmin,
        CategoryController.DeleteCategory);

        
module.exports = router;



