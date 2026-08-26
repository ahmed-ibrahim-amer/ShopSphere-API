const asyncHandler = require('express-async-handler');
const Cart = require('../models/CartModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');
const Product = require('../models/ProductModel');
const { ValidateAddItem, ValidateUpdateQuantity } = require('../validators/CartValidate');

exports.GetMyCart = asyncHandler(async(req,res)=>{

    let  cart = await Cart.findOne({user: req.user.id}).populate('items.product');
        if(!cart){
            Cart = {user: req.user.id , items:[]};
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
            Cart = await Cart.create({
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
                    updatedCart 
                }
            )
        ))
});


