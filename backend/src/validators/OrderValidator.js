const Joi = require('joi');

function ValidateCreateOrder(obj){
    const schema = Joi.object({
        shippingAddress: Joi.object({
            street: Joi.string().required(),
            city: Joi.string().required(),
            phone: Joi.string().required()
        }).required(),
        paymentMethod: Joi.string().valid('cash', 'card').default('cash')
    });
    return schema.validate(obj);
};

function ValidateUpdateStatus(obj){
    const schema = Joi.object({
        status: Joi.string().valid('pending', 'paid', 'shipped', 'delivered', 'cancelled').required()
    });
    return schema.validate(obj);
};

module.exports = { ValidateCreateOrder, ValidateUpdateStatus };