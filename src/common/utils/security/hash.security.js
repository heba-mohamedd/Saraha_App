import { hash, compare } from "bcrypt";
import { SALT_ROUNDS } from "../../../../config/config.service.js";

export const Hash = async ({ plainText, salt_rounds = SALT_ROUNDS } = {}) => {
  return await hash(plainText, Number(salt_rounds));
};

export const Compare = async ({ plainText, cipherText } = {}) => {
  return await compare(plainText, cipherText);
};
