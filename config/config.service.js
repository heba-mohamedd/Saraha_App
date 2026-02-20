import dotenv from "dotenv";
import { resolve } from "node:path";

const NODE_ENV = process.env.NODE_ENV; // return development Or production

console.log(NODE_ENV);

let envPaths = {
  development: ".env.development",
  production: ".env.production",
};
console.log(`config/${envPaths[NODE_ENV]}`);

dotenv.config({
  path: resolve(`config/${envPaths[NODE_ENV]}`),
});

export const PORT = process.env.PORT;
export const DB_URL = process.env.DB_URL;
export const WEB_CLIENT_ID = process.env.WEB_CLIENT_ID;
export const SECRET_KEY = process.env.SECRET_KEY;
export const SALT_ROUNDS = +process.env.SALT_ROUNDS;
export const IV_LENGTH = +process.env.IV_LENGTH;
export const ENCRYPTION_KEY = Buffer.from(process.env.ENCRYPTION_KEY);
