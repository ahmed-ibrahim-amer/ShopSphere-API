const User  = require('../models/UserModel');
const asyncHandler = require('express-async-handler');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');



//TODO Get All Users
exports.GetAllUsers = asyncHandler(async(req,res)=>{
    const users = await User.find();
        if(!users){
            throw new ApiError('Bad Request',400);
        }
    res.status(200).json((
        new ApiResponse(
            200,
            "Get All users is succssfully",
            {
                users
            }
        )
    ));
});


exports.getUserById = asyncHandler(async( req , res)=>{
    const user = await User.findById(req.params.id);
        if(!user){
            throw new ApiError('Bad request',400);
        }
    res.status(200).json((
        new ApiResponse(200,
            'Get user by id is successfully',
            {
                user
            }
        )
    ))    
});



exports.DeleteUser = asyncHandler(async(req,res)=>{
    const delUser = await User.findByIdAndDelete(req.params.id);
        if(!delUser){
            throw new ApiError("Bad Request",400);
        }
    res.status(200).json((
        new ApiResponse(200,
            "Delete User has been Successfully",
            {
                delUser
            }
        )
    ))    
})