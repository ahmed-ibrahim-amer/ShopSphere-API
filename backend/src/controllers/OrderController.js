const asyncHandler = require('express-async-handler');
const Order = require('../models/OrderModel');
const Cart = require('../models/CartModel');
const Product = require('../models/ProductModel');
const { ValidateCreateOrder, ValidateUpdateStatus } = require('../validators/OrderValidator');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const stripe = require('../config/stripe');


exports.checkout = asyncHandler(async(req,res)=>{

    const {error} = ValidateCreateOrder(req.body);
        if(error){
            throw new ApiError(error.details[0].message,400);
        }

    const orderItems = [];
    let totalPrice = 0;  
    const lineItems = [];

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
        lineItems.push({
            price_data: {
                currency: 'usd',
                product_data: {
                    name: product.name
                },
                unit_amount: Math.round(product.price * 100)
            },
            quantity: item.quantity
        });
    }    
    const { shippingAddress, paymentMethod } = req.body;
    const newOrder = await Order.create({
        user:req.user.id,
        items: orderItems,
        totalPrice,
        paymentMethod,
        shippingAddress
    });
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        mode: 'payment',
        line_items: lineItems,
        success_url: `http://localhost:3000/api/v1/Orders/success?orderId=${newOrder._id}`,
        cancel_url: `http://localhost:3000/api/v1/Orders/cancel`,
        metadata: {
            orderId: newOrder._id.toString()
        }
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
                order: newOrder,
                paymentUrl: session.url 
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
});

exports.UpdateOrderStatus = asyncHandler(async(req,res)=>{
    const {error} = ValidateUpdateStatus(req.body);
        if(error){
            throw new ApiError(error.details[0].message, 400);
        }
    const { status } = req.body;
    if(status !== "pending" && status !== "paid"  && status !== "shipped" && status !== "delivered" && status !== "cancelled"){
        throw new ApiError('Wrong Status',400);
    }
    const newStatus = await Order.findByIdAndUpdate(req.params.id,{
        status
    },{new:true});
        if(!newStatus){
            throw new ApiError('Order Not Found',404);
        }
    res.status(200).json((
    new ApiResponse(
        200,
        "Status has been updated",
        {
            newStatus:newStatus
        }
    )
    ))     
})






exports.stripeWebhook = asyncHandler(async(req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.log('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata.orderId;

        await Order.findByIdAndUpdate(orderId, {
            isPaid: true,
            paidAt: new Date(),
            status: 'paid'
        });

        console.log(`Order ${orderId} marked as paid!`);
    }

    res.status(200).json({ received: true });
});