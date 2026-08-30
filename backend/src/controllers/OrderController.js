const asyncHandler = require('express-async-handler');
const Order = require('../models/OrderModel');
const Cart = require('../models/CartModel');
const Product = require('../models/ProductModel');
const { ValidateCreateOrder } = require('../validators/OrderValidator');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');



exports.checkout = asyncHandler(async(req,res)=>{

    const {error} = ValidateCreateOrder(req.body);
        if(error){
            throw new ApiError(error.details[0].message,400);
        }

    const orderItems = [];
    let totalPrice = 0;  
    
    const cart = await Cart.findOne({user:req.user.id});  
    
        if(!cart || cart.items.length === 0){
            throw new ApiError('Your Cart is empty',400);
        }

    for (const item of cart.items){
        const product = await Product.findById(item.product);

            if(!product){
                throw new ApiError('Product is not found',404);
            }
        if(product.stock < item.quantity){
            throw new ApiError(`Not enough stock for ${product.name}`, 400);
        }    
        orderItems.push({
            product:product._id,
            quantity: item.quantity,
            price:product.price
        });
        totalPrice += product.price * item.quantity
    }    
    const { shippingAddress, paymentMethod } = req.body;
    const newOrder = await Order.create({
        user:req.user.id,
        items: orderItems,
        totalPrice,
        paymentMethod,
        shippingAddress
    });
    for(const item of orderItems){
        await Product.findByIdAndUpdate(
            item.product,
            { $inc: { stock: -item.quantity } }
        )
    }

    cart.items = [];
    await cart.save();

    res.status(201).json((
        new ApiResponse(
            201,
            "Order created successfully",
            {
                order: newOrder
            }
        )
    ));
});


exports.GetAllOrders = asyncHandler(async(req,res)=>{

    const orders = await Order
    .find({user:req.user.id})
    .sort('-createdAt');
    
        
    res.status(200).json((
        new ApiResponse(
            200,
            "Gat all Orders succesfully",
            {
                orders:orders
            }
        )
    ));
});

exports.GetOrderById = asyncHandler(async(req,res)=>{
    const order = await Order.findById(req.params.id).populate('items.product');
        if(!order){
            throw new ApiError('Order not found',404);
        }
        if(order.user.toString() !== req.user.id && req.user.role !== 'admin'){
            throw new ApiError('You are not allowed to view this order', 403);
        }

        res.status(200).json((
            new ApiResponse(
                200,
                "Get order by id is successfully",
                {
                    order: order
                }
            )
        ));       
})