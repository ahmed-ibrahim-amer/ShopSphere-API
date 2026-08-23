const joi = require('joi');


function validateSignUp(obj){
    const Schema = joi.object({
        name:joi.string().required(),
        email:joi.string().lowercase().trim().required(),
        password:joi.string().min(8).max(30).required(),
        phone:joi.number().required(),
        role:joi.string().required(),
        avatar:joi.string(), 
    });
    return Schema.validate(obj);
};

function validateUpdate(obj){
    const Schema = joi.object({
        name:joi.string(),
        email:joi.string().lowercase().trim(),
        password:joi.string().min(8).max(30),
        phone:joi.number(),
        role:joi.string(),
        avatar:joi.string(), 
    });
    return Schema.validate(obj);
};

function validateLogin(obj){
    const Schema = joi.object({
        email:joi.string().lowercase().trim().required(),
        password:joi.string().min(8).max(30).required()
    });
    return Schema.validate(obj);
}

module.exports = { validateSignUp , validateUpdate , validateLogin};