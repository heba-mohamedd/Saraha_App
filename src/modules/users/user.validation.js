import Joi from "joi";
import { GenderEnum } from "../../common/enum/user.enum.js";
import { general_rules } from "../../common/utils/generalRules.js";

export const signUpSchema = {
  body: Joi.object({
    userName: Joi.string().min(4).max(30).required(),
    email: general_rules.email.required(),
    password: general_rules.password.required(),
    cPassword: general_rules.cPassword.required(),
    age: Joi.number().integer().positive().min(18).max(60),
    gender: Joi.string().valid(...Object.values(GenderEnum)),
    phone: Joi.string(),
  }).required(),

  // file: general_rules.file.required(),

  // files: Joi.array().max(2).items(general_rules.file.required()).required(),

  files: Joi.object({
    attachment: Joi.array()
      .max(1)
      .items(general_rules.file.required())
      .required(),
    attachments: Joi.array()
      .max(3)
      .items(general_rules.file.required())
      .required(),
  }).required(),
};

export const signInSchema = {
  body: Joi.object({
    email: general_rules.email.required(),
    password: general_rules.password.required(),
  }).required(),
};

export const shareProfileSchema = {
  params: Joi.object({
    id: general_rules.id.required(),
  }).required(),
};

export const updataProfileSchema = {
  body: Joi.object({
    userName: Joi.string().min(4).max(30).required(),
    age: Joi.number().integer().positive().min(18).max(60),
    gender: Joi.string().valid(...Object.values(GenderEnum)),
    phone: Joi.string(),
  }).required(),
};

export const updataPasswordSchema = {
  body: Joi.object({
    newPassword: general_rules.password.required(),
    cPassword: Joi.string().valid(Joi.ref("newPassword")),
    oldPassword: general_rules.password.required(),
  }).required(),
};

export const confirmEmailSchema = {
  body: Joi.object({
    email: general_rules.email.required(),
    code: Joi.string()
      .regex(/^\d{6}$/)
      .required(),
  }).required(),
};

export const resendOtpSchema = {
  body: Joi.object({
    email: general_rules.email.required(),
  }).required(),
};

export const resetPasswordSchema = {
  body: Joi.object({
    email: general_rules.email.required(),
    code: Joi.string()
      .regex(/^\d{6}$/)
      .required(),
    password: general_rules.password.required(),
  }).required(),
};
