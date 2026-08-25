const asyncHandler = require('express-async-handler');
const Cart = require('../models/CartModel');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');


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