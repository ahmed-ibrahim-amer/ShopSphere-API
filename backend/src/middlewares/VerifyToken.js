const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');
const {redisClient} = require('../cache/redis');
const asyncHandler = require('express-async-handler');



const VerifyToken = asyncHandler(async (req,res,next)=>{

    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

        if(token){
            try{
                const decoded  = jwt.verify(token , process.env.JWT_SECRET);
                req.user = decoded;
                next()
            }catch(error){
                throw new ApiError('Invalid Token',401);
            }
            
        }else{
            throw new ApiError('No Token Provided',401);
        }

})

const VerifyRole = (req, res, next) => {

    if (
        req.user.id === req.params.id ||
        req.user.role === "admin"
    ) {
        next();
    } else {
        throw new ApiError("You are not allowed", 403);
    }

};

const VerifyAdmin = (req,res,next) => {
        if(req.user.role === 'admin'){
                next()
            }else{
                throw new ApiError('You dont have any permission',403);
            }
};


module.exports = { VerifyToken , VerifyRole , VerifyAdmin};