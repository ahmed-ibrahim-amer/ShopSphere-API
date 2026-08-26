const express = requrie('express');
const router = express.Router();
const CartController = require('../controllers/CartContoller');


router.get('/', VerifyToken, CartController.GetMyCart);
router.post('/items', VerifyToken, CartController.AddItemToCart);
router.patch('/items/:productId', VerifyToken, CartController.UpdateItemQuantity);
router.delete('/items/:productId', VerifyToken, CartController.RemoveItemFromCart);

module.exports = router;