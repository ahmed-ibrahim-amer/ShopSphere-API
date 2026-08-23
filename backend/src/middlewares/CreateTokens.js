const jwt = require('jsonwebtoken');
// const env = require('../config/env');
const dotenv = require('dotenv');
dotenv.config();


const createAccessToken = (id, role)=>{
    return jwt.sign({id:id , role:role},process.env.JWT_SECRET,{
        expiresIn: '20min'
    });
};

const createRefreshToken = (id, role) => {
    return jwt.sign({id:id , role:role},process.env.REFRESH_TOKEN,{
        expiresIn: '7d'
    })
};

module.exports = {createAccessToken,createRefreshToken};



