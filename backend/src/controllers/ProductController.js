const asyncHandler = require('express-async-handler');
const Product = require('../models/ProductModel');
const Category  = require('../models/CategoryModel');
const {ValidateNewProduct,ValidateUpdateProduct} =require('../validators/ProductValidate');
const ApiError = require('../utils/ApiError');
const ApiResponse = require('../utils/ApiResponse');



exports.createProduct = asyncHandler(async(req,res)=>{
    const {error} = ValidateNewProduct(req.body);
        if(error){
            throw new ApiError(error.details[0].message,400);
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
            isActive
        } = req.body;

    const categoryExisting = await Category.findById(req.body.category);
        if(!categoryExisting){
            throw new ApiError('Category not found', 404);
        }
    const newProduct = await  Product.create({
            name,
            slug,
            description,
            price,
            discountPrice,
            stock,
            category,
            images,
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



exports.GetAllProducts = asyncHandler(async(req,res)=>{

    //COPY FROM QUERY OBJECT
    const queryObj = {...req.query};

    //Remove special query fields
    const excludeFields = ['sort','page','limit','fields'];

    excludeFields.forEach(el => delete queryObj[el]);

    //Advanced Filtering
    let queryStr = JSON.stringify(queryObj);

    queryStr = queryStr.replace(
        /\b(gte|gt|lte|lt)\b/g,
        match=> `$${match}`
    );

    const mongoQuery = JSON.parse(queryStr);

    let query = Product.find(mongoQuery);
    

    //Sorting
    if(req.query.sort){
        const sortBy = req.query.sort.split(',').join(' ');
        query = query.sort(sortBy);
    }else{
        query = query.sort(`-createdAt`);
    }

    //Fiedls limit
    if(req.query.fields){
        const fields = req.query.fields.split(',').join(' ');
        query = query.select(fields);
    }else{
        query = query.select('-__v');
    };

    //Pagination
    const page = Math.max(Number(req.query.page)||1,1);
    const limit = Number(req.query.limit)||10;
    const skip = (page - 1) * limit;
    query = query.skip(skip).limit(limit);


    query = query.populate('category');


    const products = await query;
        if(!products){
            throw new ApiError('Bad Request',400);
        }

    res.status(200).json((
        new ApiResponse(
            200,
            "Get all products is successfully",
            {
                Products: products,
                Results: products.length

            }
        )
    ));
});

exports.UpdateProduct = asyncHandler(async(req,res)=>{
    const {error} = ValidateUpdateProduct(req.body);
        if(error){
            throw new ApiError(error.details[0].message , 400);
        }
    const {
            name,
            slug,
            description,
            price,
            discountPrice,
            stock,
            category,
            images,
            isActive
        } = req.body;

    const UpdateProduct = await  Product.findByIdAndUpdate( req.params.id,{
            name,
            slug,
            description,
            price,
            discountPrice,
            stock,
            category,
            images,
            isActive
    }, { new: true, runValidators: true });
        if(!UpdateProduct){
            throw new ApiError('Bad Request',400);
        } 
        
        
    res.status(200).json((
        new ApiResponse(
            200,
            "Product has been updated" ,
            {
                product: UpdateProduct
            }
        )
    ));       
});

exports.DeleteProduct = asyncHandler(async(req,res)=>{
    const delProduct = await Product.findByIdAndDelete(req.params.id);
    if(!delProduct){
        throw new ApiError('Bad Request',400);
    }
    res.status(200).json((
        new ApiResponse(
            200,
            "Product has been deleted",
            {
                message: "Product has been deleted"
            }
    )));
});



exports.GetProductById = asyncHandler(async(req,res)=>{
    const product = await Product.findById(req.params.id).populate('category');
        if(!product){
            throw new ApiError('No Product found',404);
        }
    res.status(200).json((
        new ApiResponse(
            200,
            "Get product",
            {
                Product: product
            }
    )));    
});