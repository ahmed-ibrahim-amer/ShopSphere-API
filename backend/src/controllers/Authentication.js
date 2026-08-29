//Import user model
const expressAsyncHandler = require('express-async-handler');
const bcrypt = require('bcrypt');
const User = require('../models/UserModel');
const {createAccessToken,createRefreshToken}= require('../middlewares/CreateTokens');
//Import libraries
const asyncHandler = require('express-async-handler');
//Import validators
const { validateSignUp , validateUpdate , validateLogin } = require('../validators/UserValidate');
//Import apiError
const ApiError = require('../utils/ApiError');
//Import ApiResponse
const ApiResponse = require('../utils/ApiResponse');

const jwt = require('jsonwebtoken');
const  {redisClient , connectRedis} = require('../cache/redis');






exports.Register = asyncHandler(async (req , res) => {

    const { error } = validateSignUp(req.body);

        if (error) {
            throw new ApiError(error.details[0].message, 400);
        }

    const { name, email, password, role, phone, avatar } = req.body;

    const checkMail = await User.findOne({ email });

    if (checkMail) {
        throw new ApiError('Email already exists', 400);
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
        name,
        email,
        password: hashedPassword,
        role: 'user',
        phone,
        avatar
    });

    const createToken = createAccessToken(newUser.id, newUser.role);
    const refreshToken = createRefreshToken(newUser.id, newUser.role);


    // statusCode / message / data
    res.status(201).json(
        new ApiResponse(
            201,
            'User registered successfully',
            {
                user: newUser,
                AccessToken: createToken,
                refreshToken: refreshToken
            }
        )
    );
});

exports.Login =  asyncHandler(async(req,res)=>{

    const {error} = validateLogin(req.body);
        if(error){
            throw new ApiError(error.details[0].message , 400);
        }
    const {email , password} = req.body;
    
    const user = await User.findOne({email});
        if(!user){
            throw new ApiError('Invalid Email or Password' , 400);
        }

    //Check if That is correct password  
    const isMatch = await bcrypt.compare(password , user.password);
        if(!isMatch){
            throw new ApiError('Invalid Email or Password',400)
        }   


    //Users Tokens    
    const createToken = createAccessToken(user.id, user.role);
    const LongTermToken = createRefreshToken(user.id, user.role);
    
    await redisClient.set(
        `refresh_token:${user._id}`,
        LongTermToken,{
            EX:7 * 24 * 60 * 60
        }
    )

    res.status(200).json((
        new ApiResponse(200 ,
            "User login is successfully",
            {
                user: user,
                AccessToken: createToken,
                refreshToken: LongTermToken
            }
        )
    ));
});

//TODO refresh-token function
exports.RefreshToken = asyncHandler(async (req, res) => {

    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError("Refresh token is required", 401);
    }

    let decoded;

    try {

        decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN
        );

    } catch (error) {

        throw new ApiError(
            "Invalid or expired refresh token",
            401
        );
    }

    const storedRefreshToken = await redisClient.get(
        `refresh_token:${decoded.id}`
    );

    if (!storedRefreshToken || storedRefreshToken !== refreshToken) {
        throw new ApiError("Invalid Refresh Token", 401);
    }

    const accessToken = createAccessToken(
        decoded.id,
        decoded.role
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Access token refreshed successfully",
            {
                accessToken
            }
        )
    );
});


// exports.Logout = asyncHandler(async(req,res,next)=>{
//     req.Logout((err)=>{
//         if (err) { 
//             return next(err); 
//         }
//         return res.status(200).json({ message: "Logged out successfully" });;
//     });
// });



exports.Logout = asyncHandler(async (req, res) => {

    const { refreshToken } = req.body;

    if (!refreshToken) {
        throw new ApiError("Refresh token is required", 401);
    }

    let decoded;

    try {

        decoded = jwt.verify(
            refreshToken,
            process.env.REFRESH_TOKEN
        );

    } catch (error) {

        throw new ApiError(
            "Invalid or expired refresh token",
            401
        );
    }

    await redisClient.del(
        `refresh_token:${decoded.id}`
    );

    res.status(200).json(
        new ApiResponse(
            200,
            "Logged out successfully"
        )
    );
});