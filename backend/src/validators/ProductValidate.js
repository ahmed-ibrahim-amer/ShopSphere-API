const Joi = require('joi');

function ValidateNewProduct(obj) {
    const schema = Joi.object({

        name: Joi.string()
            .trim()
            .required(),

        slug: Joi.string()
            .lowercase()
            .trim()
            .required(),

        description: Joi.string()
            .required(),

        price: Joi.number()
            .min(0)
            .required(),

        discountPrice: Joi.number()
            .min(0)
            .default(0),

        stock: Joi.number()
            .min(0)
            .default(0),

        category: Joi.string()
            .required(),

        images: Joi.array()
            .items(Joi.string()),

        ratingsAverage: Joi.number()
            .min(0)
            .max(5)
            .default(0),

        ratingsCount: Joi.number()
            .default(0),

        isActive: Joi.boolean()
            .default(true)
    });

    return schema.validate(obj);
}



function ValidateUpdateProduct(obj){
    const schema = Joi.object({
        name:Joi.string().trim(),
        slug:Joi.string().lowercase().trim(),
        description:Joi.string(),
        price:Joi.number().min(0),
        discountPrice:Joi.number().default(0),
        stock:Joi.number().min(0).default(0),
        category: Joi.string(),
        images:Joi.array().items(Joi.string()),
        ratingsAverage:Joi.number().min(0).max(5).default(0),
        ratingsCount:Joi.number().default(0),
        isActive:Joi.boolean().default()
    });
    return schema.validate(obj);
}





module.exports = {ValidateNewProduct,ValidateUpdateProduct};