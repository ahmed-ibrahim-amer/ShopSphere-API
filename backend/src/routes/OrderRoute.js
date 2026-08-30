const express = require('express');
const router = express.Router();
const OrderController = require('../controllers/OrderController');
const { VerifyToken, VerifyRole, VerifyAdmin } = require('../middlewares/VerifyToken');

router.post('/checkout', VerifyToken, OrderController.checkout);
router.get('/', VerifyToken, OrderController.GetAllOrders);
router.get('/:id', VerifyToken, OrderController.GetOrderById);


module.exports = router;