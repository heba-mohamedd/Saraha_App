import Joi from "joi";
import { Types } from "mongoose";

export const general_rules = {
  email: Joi.string().email({
    tlds: { allow: true },
    minDomainSegments: 2,
    maxDomainSegments: 2,
  }),
  password: Joi.string()
    .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/)
    .message(
      "Password must be at least 8 characters and include uppercase, lowercase, and a number",
    ),
  cPassword: Joi.string().valid(Joi.ref("password")),
  id: Joi.string().custom((value, helper) => {
    const isValid = Types.ObjectId.isValid(value);
    return isValid ? value : helper.message("inValid id");
  }),
  file: Joi.object({
    fieldname: Joi.string().required(),
    originalname: Joi.string().required(),
    encoding: Joi.string().required(),
    mimetype: Joi.string().required(),
    destination: Joi.string().required(),
    filename: Joi.string().required(),
    path: Joi.string().required(),
    size: Joi.number().required(),
  }).messages({
    "any.required": "file is required",
  }),
};
