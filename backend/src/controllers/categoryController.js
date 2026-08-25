const asyncHandler = require('express-async-handler');
const Category  = require('../models/CategoryModel');
const { ValidateNewCategory, ValidateUpdateCategory } = require('../validators/CategoryValidator');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');



exports.CreateCategory = asyncHandler(async(req,res)=>{
    const {error} = ValidateNewCategory(req.body);
        if(error){
                    throw new ApiError(error.details[0].message,400);
            };
    const{ 
        name,
        slug,
        image,
        parentCategory,
        isActive} = req.body;    

    const newCategory = await Category.create({
        name,
        slug,
        image,
        parentCategory,
        isActive
    });

        if(!newCategory){
            throw new ApiError("Bad Request",400);
        }

    res.status(201).json((
        new ApiResponse(
            201,
            "Category has been created",
            {
                Category: newCategory
            }
        )
    ));       
});


exports.GetAllCategory = asyncHandler(async(req,res)=>{
    const getCategory = await Category.find();
        if(!getCategory){
            throw new ApiError('Bad Request',400);
        }

    res.status(200).json((
        new ApiResponse(
            200,
            "Gat all Category",
            {
                Category: getCategory
            }
        )
    ));    
});


exports.UpdateCategory = asyncHandler(async(req,res)=>{
    const {error} = ValidateUpdateCategory(req.body);
        if(error){
            throw new ApiError(error.details[0].message,400);
        }
        const  {
        name,
        slug,
        image,
        parentCategory,
        isActive
        } = req.body;
    const updateCategory = await Category.findByIdAndUpdate(req.params.id,
        {
        name,
        slug,
        image,
        parentCategory,
        isActive
        },
        {new:true}
    );
    if(!updateCategory){
        throw new ApiError('Bad Request',400);
    }
    res.status(200).json((
        new ApiResponse(
            200,
            "Category has been updated",
            {
                newUpdate: updateCategory
            }
        )
    ));
});




exports.getCategoryById = asyncHandler(async(req,res)=>{
    const getCategory = await Category.findById(req.params.id);
        if(!getCategory){
            throw new ApiError('Category not found',404);
        }
    res.status(200).json((
        new ApiResponse(
            200,
        "Get category",
        {
            category: getCategory
        }
        )
    ))
});


exports.DeleteCategory = asyncHandler(async(req,res)=>{
    const removeCategory = await Category.findByIdAndDelete(req.params.id);
        if(!removeCategory){
            throw new ApiError('Category not found',404);
        }
    res.status(200).json((
        new ApiResponse(
                200,
        "Category has been deleted"
        ,
            {
                message: "Category has been deleted"
            }
        )

    ))
});