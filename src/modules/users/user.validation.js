import Joi from "joi";
import { GenderEnum } from "../../common/enum/user.enum.js";

export const signUpSchema = {
  body: Joi.object({
    userName: Joi.string().alphanum().min(4).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().required(),
    cPassword: Joi.string().valid(Joi.ref("password")).required(),
    age: Joi.number().integer().positive().min(18).max(60),
    gender: Joi.string().valid(...Object.values(GenderEnum)),
    phone: Joi.string(),
  }).required(),
};

export const signInSchema = {
  body: Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required(),
  }).required(),
};
