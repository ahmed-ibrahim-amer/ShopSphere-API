const mongoose = require('mongoose');
const joi = require('joi');




const UserSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        unique:false
    },
    email:{
        type:String,
        required:true,
        unique:true,
        lowercase:true,
        trim:true
    },
    password:{
        type:String,
        required:true,
    },
    phone:{
        type:Number,
        required:true
    },
    role:{
        type:String,
        enum:['admin', 'manager' , 'user'],
        default:'user'
    },
    avatar:{
        type:String,
        default: "default.png"
    },
    isVerified:{
        type:Boolean,
        default:false
    }
},{timestamps:true});

const User = mongoose.model('User', UserSchema);


// function validateSignUp(obj){
//     const Schema = joi.object({
//         name:joi.string().required(),
//         email:joi.string().lowercase().trim().required(),
//         password:joi.string().min(8).max(30).required(),
//         phone:joi.number().required(),
//         role:joi.string().required(),
//         Avatar:joi.string().required(), 
//     });
//     return Schema.validate(obj);
// };

// function validateUpdate(obj){
//     const Schema = joi.object({
//         name:joi.string(),
//         email:joi.string().lowercase().trim(),
//         password:joi.string().min(8).max(30),
//         phone:joi.number(),
//         role:joi.string(),
//         Avatar:joi.string(), 
//     });
//     return Schema.validate(obj);
// };



module.exports = User; 


