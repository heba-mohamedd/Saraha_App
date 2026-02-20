import {
  SALT_ROUNDS,
  SECRET_KEY,
  WEB_CLIENT_ID,
} from "../../../config/config.service.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import { successResponse } from "../../common/utils/response.success.js";
import {
  decrypt,
  encrypt,
} from "../../common/utils/security/encrypt.security.js";
import { Compare, Hash } from "../../common/utils/security/hash.security.js";
import {
  GenerateToken,
  VerifyToken,
} from "../../common/utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { OAuth2Client } from "google-auth-library";

export const signUp = async (req, res, next) => {
  const { userName, email, password, cPassword, phone, age, gender } = req.body;

  if (userName.split(" ").length < 2) {
    // return res.status(409).json({ message: "lastName is require" });
    throw new Error("lastName is require", { cause: 406 });
  }
  if (password !== cPassword) {
    throw new Error(" password not matched", { cause: 400 });
  }

  if (await db_service.findOne({ model: userModel, filter: { email } })) {
    throw new Error("email already exist", { cause: 409 });
    // Or
    // next(new Error("email already exist")); // when send error to next function ===> go to global error handling
    // return res.status(409).json({ message: "email already exist" });
  }
  const user = await db_service.create({
    model: userModel,
    data: {
      userName,
      email,
      password: Hash({ plainText: password, salt_rounds: SALT_ROUNDS }),
      age,
      gender,
      phone: encrypt(phone),
    },
  });
  successResponse({ res, status: 201, data: user });
};

export const signUpWithGmail = async (req, res, next) => {
  const { idToken } = req.body;
  const client = new OAuth2Client();

  const ticket = await client.verifyIdToken({
    idToken: idToken,
    audience: WEB_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  const { name, email, email_verified, picture } = payload;
  let user = await db_service.findOne({ model: userModel, filter: { email } });
  // if user dose not exist , created and signed in at same step
  if (!user) {
    user = await db_service.create({
      model: userModel,
      data: {
        email,
        userName: name,
        profilePicture: picture,
        confirmed: email_verified,
        provider: ProviderEnum.google,
      },
    });
  }
  if (user.provider == ProviderEnum.system) {
    throw new Error("please log in on system only", { cause: 400 });
  }
  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    message: "sign in success",
    data: { access_token: access_token, user },
  });
};

export const signIn = async (req, res, next) => {
  const { email, password } = req.body;
  if (!email && !password)
    throw new Error("Email & Password are required", { cause: 406 });
  if (!email) throw new Error("Email is required", { cause: 406 });
  if (!password) throw new Error("Password is required", { cause: 406 });

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      provider: ProviderEnum.system,
    },
  });
  if (!user) {
    //   return res.status(409).json({ message: "user not exist" });
    throw new Error("user not exist", { cause: 404 });
  }
  if (!Compare({ plainText: password, cipherText: user.password })) {
    //   return res.status(409).json({ message: "Invalid Password" });
    throw new Error("Invalid Password", { cause: 400 });
  }

  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: SECRET_KEY,
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    message: "sign in success",
    data: { access_token: access_token, user },
  });
};

export const getProfile = async (req, res, next) => {
  const { user } = req;

  user.phone = decrypt(user.phone);
  // or ===> data:{...user._doc , phone:decrypt(user.phone)}
  successResponse({ res, message: "user Profile", data: user });
};
