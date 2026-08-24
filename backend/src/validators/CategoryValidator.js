const Joi = require('joi');

function ValidateNewCategory(obj){
    const schema = Joi.object({
        name: Joi.string().trim().required(),
        slug: Joi.string().lowercase().trim().required(),
        image: Joi.string(),
        description: Joi.string(),
        parentCategory: Joi.string(),
        isActive: Joi.boolean()
    });
    return schema.validate(obj);
};

function ValidateUpdateCategory(obj){
    const schema = Joi.object({
        name: Joi.string().trim(),
        slug: Joi.string().lowercase().trim(),
        image: Joi.string(),
        description: Joi.string(),
        parentCategory: Joi.string(),
        isActive: Joi.boolean()
    });
    return schema.validate(obj);
};

module.exports = { ValidateNewCategory, ValidateUpdateCategory };