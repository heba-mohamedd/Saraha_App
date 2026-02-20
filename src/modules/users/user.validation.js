import Joi from "joi";

export const signUpSchema = {
  body: Joi.object({
    userName: Joi.string().required(),
    email: Joi.string().required(),
    password: Joi.string().required(),
    cPassword: Joi.ref("password"),
    age: Joi.number().integer().min(18).max(60),
  }).required(),
};
