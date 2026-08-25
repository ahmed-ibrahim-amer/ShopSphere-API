const Joi = require('joi');

function ValidateAddItem(obj){
    const schema = Joi.object({
        productId: Joi.string().required(),
        quantity: Joi.number().min(1).default(1)
    });
    return schema.validate(obj);
};

function ValidateUpdateQuantity(obj){
    const schema = Joi.object({
        quantity: Joi.number().min(1).required()
    });
    return schema.validate(obj);
};

module.exports = { ValidateAddItem, ValidateUpdateQuantity };