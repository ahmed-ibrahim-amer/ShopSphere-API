const asynHandler = require('express-async-handler');
const Product = require('../models/ProductModel');
const category = require('../models/CategoryModel');
const {ValidateNewProduct,ValidateUpdateProduct} =require('../validators/ProductValidate');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');



exports.createProduct = asyncHandler(async(req,res)=>{
    const {error} = ValidateNewProduct(req.body);
        if(error){
            throw new ApiError(error.details[0].message);
        };

    const {
            name,
            slug,
            description,
            price,
            discountPrice,
            stock,
            category,
            images,
            ratingsAverage,
            ratingsCount,
            isActive
        } = req.body;

    const categoryExisting = await category.findById(req.body.category);
        if(!categoryExisting){
            throw new ApiError('Bad Request',400);
        }
    const newProduct = await  category.create({
            name,
            slug,
            description,
            price,
            discountPrice,
            stock,
            category,
            images,
            ratingsAverage,
            ratingsCount,
            isActive
    });
        if(!newProduct){
            throw new ApiError('Bad Request',400);
        } 
        
        
    res.status(201).json((
        new ApiResponse(
            201,
            "New product has been created",
            {
                product: newProduct
            }
        )
    ));   
});
