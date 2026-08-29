const asyncHandler = require('express-async-handler');
const Cart = require('../models/CartModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Product = require('../models/ProductModel');
const { ValidateAddItem, ValidateUpdateQuantity }= require('../validators/CartValidator');

exports.GetMyCart = asyncHandler(async(req,res)=>{

    let  cart = await Cart.findOne({user: req.user.id}).populate('items.product');
        if(!cart){
            cart = {user: req.user.id , items:[]};
        }

    res.status(200).json((
        new ApiResponse(
            200,
            "Get cart successfully",
            {
                cart: cart
            }
        )
    ));
});


exports.AddItemToCart = asyncHandler(async(req,res)=>{ 
    const {error} = ValidateAddItem(req.body);
        if(error){
            throw new ApiError(error.details[0].message, 400);
        }
    const { productId, quantity } = req.body;
    const ExistisProduct = await Product.findById(productId);
        if(!ExistisProduct){
            throw new ApiError('Product Not Found',404);
        }
    let cart = await Cart.findOne({user:req.user.id});
        if(!cart){
            cart = await Cart.create({
                user:req.user.id,
                items:[{product :productId , quantity:quantity}]
            });
        }else{
            const itemIndex = cart.items.findIndex(
                item => item.product.toString() === productId
            );
            if(itemIndex > -1){
                cart.items[itemIndex].quantity += quantity || 1
            }else{
                cart.items.push({product:productId, quantity:quantity ||1})
            }
            await cart.save();
        }
        const updatedCart  = await Cart.findOne({user:req.user.id}).populate('items.product');
        res.status(201).json((
            new ApiResponse(
                201,
                "Add item to cart",
                {
                    cart: updatedCart 
                }
            )
        ))
});


exports.UpdateItemQuantity = asyncHandler(async(req,res)=>{
    const {error} = ValidateUpdateQuantity(req.body);
        if(error){
            throw new ApiError(error.details[0].message, 400);
        }
        let cart = await Cart.findOne({user:req.user.id});
            if(!cart){
                throw new ApiError('Cart not found',404);
            }
        const { productId } = req.params;
        const { quantity } = req.body;
        
        const item = cart.items.find(
            item => item.product.toString() === productId
        ); 
    
        if(!item){
            throw new ApiError('Item not found in cart',404);
        }
        
        item.quantity = quantity;
        await cart.save();    // ✅ save FIRST

        const updatedCart = await Cart.findOne({user:req.user.id}).populate('items.product');   // ✅ THEN fetch fresh data

        res.status(200).json((
            new ApiResponse(
                200,
                "Product quantity updated successfully",
                {
                    cart: updatedCart     // also renamed "data" → "cart" for consistency
                }
            )
        ));
});

// Steps for your function (plain English, before code)
// Validate: need productId from the request (from URL params, probably req.params.productId)
// Find the user's cart — if no cart, throw 404
// Bonus check: confirm the product is actually IN the cart before removing (good practice — tells user clearly if nothing happened)
// Use .filter() to build a new items array, without that product
// Save the cart
// Send back the updated cart

exports.RemoveItemFromCart = asyncHandler(async(req,res)=>{
    const {productId} = req.params;

    let cart = await Cart.findOne({user:req.user.id});
        if(!cart){
            throw new ApiError('Cart is not found',404);
        }
    const existProduct = cart.items.some(item => item.product.toString() === productId)   
        if(!existProduct){
                throw new ApiError('Product Not Found',404);
            }

    cart.items = cart.items.filter(
        item => item.product.toString() !== productId
    );

    await cart.save();

    res.status(200).json((
        new ApiResponse(
            200,
            "item has been deleted",
            {
                message:"item has been deleted"
            }
        )
    ))
});