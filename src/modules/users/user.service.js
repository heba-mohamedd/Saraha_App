import { randomUUID } from "node:crypto";
import { OAuth2Client } from "google-auth-library";
import {
  ACCESS_SECRET_KEY,
  PREFIX,
  REFRESH_SECRET_KEY,
  SALT_ROUNDS,
  WEB_CLIENT_ID,
} from "../../../config/config.service.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import cloudinary from "../../common/utils/cloudinary.js";
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
import fs from "node:fs";
import {
  block_otp_key,
  deleteKey,
  expire,
  get,
  get_key,
  get_ttl,
  incr,
  keys,
  max_otp_key,
  otp_key,
  revoked_key,
  setValue,
} from "../../DB/redis/redis.service.js";
import { generateOtp, sendEmail } from "../../common/utils/email/send.email.js";
import { eventEmitter } from "../../common/utils/email/email.events.js";
import { emailEnum } from "../../common/enum/email.enum.js";
import { emailTemplete } from "../../common/utils/email/email.templete.js";

// upload files in local
// export const signUp = async (req, res, next) => {

//   try {
//     const { userName, email, password, cPassword, phone, age, gender } =
//       req.body;

//     console.log(req.files);
//     if (userName.trim().split(" ").length < 2) {
//       throw new Error("lastName is require", { cause: 406 });
//     }
//     if (password !== cPassword) {
//       throw new Error(" password not matched", { cause: 400 });
//     }

//     if (await db_service.findOne({ model: userModel, filter: { email } })) {
//       throw new Error("email already exist", { cause: 409 });
//       // Or
//       // next(new Error("email already exist")); // when send error to next function ===> go to global error handling
//       // return res.status(409).json({ message: "email already exist" });
//     }

//     let arr_paths = [];
//     for (const file of req.files.attachments) {
//       arr_paths.push(file.path);
//     }

//     let userData = {
//       userName,
//       email,
//       password: Hash({ plainText: password, salt_rounds: SALT_ROUNDS }),
//     };
//     if (phone) userData.phone = encrypt(phone);
//     if (age) userData.age = age;
//     if (gender) userData.gender = gender;

//     const user = await db_service.create({
//       model: userModel,
//       data: {
//         ...userData,
//         profilePicture: req.files.attachment[0].path,
//         coverPictures: arr_paths,
//       },
//     });

//     successResponse({ res, status: 201, data: user });
//   } catch (error) {
//     if (error && req.files) {
//       if (req.files.attachment) {
//         fs.unlinkSync(req.files.attachment[0].path);
//       }

//       if (req.files.attachments) {
//         for (const file of req.files.attachments) {
//           fs.unlinkSync(file.path);
//         }
//       }
//       next(error);
//     }
//   }
// };

export const sendEmailOtp = async ({ email, subject } = {}) => {
  const isBlocked = await get_ttl(block_otp_key({ email, subject }));
  if (isBlocked > 0) {
    throw new Error(
      `you are blocked ,please try again after ${isBlocked} seconds`,
    );
  }
  const ttl = await get_ttl(otp_key({ email, subject }));
  if (ttl > 0) {
    throw new Error(`you can resend otp after ${ttl} seconds`);
  }
  const maxOtp = await get(max_otp_key({ email, subject }));
  if (maxOtp >= 3) {
    await setValue({
      key: block_otp_key({ email, subject }),
      value: 1,
      ttl: 5 * 60,
    });
    throw new Error(`Too many attempts. Please try again later.`);
  }

  const otp = await generateOtp();

  // Fire-and-forget: send email asynchronously via event
  eventEmitter.emit(subject, async () => {
    await sendEmail({
      to: email,
      subject: "Saraha App",
      html: emailTemplete(otp),
    });
  });

  // OTP storage MUST be outside the event callback to guarantee it's saved
  await setValue({
    key: otp_key({ email, subject }),
    value: await Hash({ plainText: `${otp}` }),
    ttl: 2 * 60,
  });
  const newCount = await incr(max_otp_key({ email, subject }));
  if (newCount === 1) {
    await expire(max_otp_key({ email, subject }), 6 * 60);
  }
};

export const signUp = async (req, res, next) => {
  let profilePicture_PublicId = null;
  let CoverPicture_PublicId = [];
  try {
    const { userName, email, password, cPassword, phone, age, gender } =
      req.body;

    if (userName.trim().split(" ").length < 2) {
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

    let profilePicture = null;

    if (req.files?.attachment) {
      const { secure_url, public_id } = await cloudinary.uploader.upload(
        req.files.attachment[0].path,
        { folder: "sarah-app/users" },
      );
      profilePicture = { secure_url, public_id };
      profilePicture_PublicId = { public_id };
      fs.unlinkSync(req.files.attachment[0].path);
    }

    let arr_paths = [];

    if (req.files?.attachments) {
      for (const file of req.files.attachments) {
        const { secure_url, public_id } = await cloudinary.uploader.upload(
          file.path,
          {
            folder: "sarah-app/users",
          },
        );
        arr_paths.push({ secure_url, public_id });
        CoverPicture_PublicId.push({ public_id });
        fs.unlinkSync(file.path);
      }
    }
    console.log({ profilePicture_PublicId, CoverPicture_PublicId });

    let userData = {
      userName,
      email,
      password: await Hash({ plainText: password, salt_rounds: SALT_ROUNDS }),
    };
    if (phone) userData.phone = encrypt(phone);
    if (age) userData.age = age;
    if (gender) userData.gender = gender;

    const user = await db_service.create({
      model: userModel,
      data: {
        ...userData,
        profilePicture,
        coverPictures: arr_paths,
      },
    });

    const otp = await generateOtp();

    // Fire-and-forget: send email asynchronously via event
    eventEmitter.emit(emailEnum.confirmEmail, async () => {
      await sendEmail({
        to: email,
        subject: "Saraha App",
        html: emailTemplete(otp),
      });
    });

    // OTP storage MUST be outside the event callback to guarantee it's saved
    await setValue({
      key: otp_key({ email, subject: emailEnum.confirmEmail }),
      value: await Hash({ plainText: `${otp}` }),
      ttl: 2 * 60,
    });
    await setValue({ key: max_otp_key({ email }), value: 1, ttl: 6 * 60 });

    successResponse({ res, status: 201, data: user });
  } catch (error) {
    if (req.files?.attachment) {
      if (profilePicture_PublicId?.public_id) {
        await cloudinary.uploader.destroy(profilePicture_PublicId.public_id);
      }

      if (fs.existsSync(req.files.attachment[0].path)) {
        fs.unlinkSync(req.files.attachment[0].path);
      }
    }

    if (req.files?.attachments) {
      for (const file of req.files.attachments) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }

      for (const picture of CoverPicture_PublicId) {
        await cloudinary.uploader.destroy(picture.public_id);
      }
    }

    next(error);
  }
};

export const confirmEmail = async (req, res, next) => {
  const { email, code } = req.body;
  const otpValue = await get(
    otp_key({ email, subject: emailEnum.confirmEmail }),
  );
  if (!otpValue) {
    throw new Error("otp expired");
  }

  if (!(await Compare({ plainText: code, cipherText: otpValue }))) {
    throw new Error("Invalid Otp", { cause: 400 });
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: ProviderEnum.system,
    },
    update: { confirmed: true },
  });
  if (!user) {
    throw new Error("user not Exist", { cause: 400 });
  }
  await deleteKey(otp_key({ email, subject: emailEnum.confirmEmail }));
  successResponse({ res, message: "Email Confirmed Successfully" });
};
export const resendOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: false },
      provider: ProviderEnum.system,
    },
  });
  if (!user) {
    throw new Error("user not Exist or already Confirmed", { cause: 400 });
  }
  await sendEmailOtp({ email, subject: emailEnum.confirmEmail });
  successResponse({ res, message: "Email Confirmed Successfully" });
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
    secret_key: ACCESS_SECRET_KEY,
    options: { expiresIn: "1h" },
  });
  successResponse({
    res,
    message: "sign in success",
    data: { access_token: access_token, user },
  });
};

export const forgetPassword = async (req, res, next) => {
  const { email } = req.body;
  if (!email) throw new Error("Email is required", { cause: 406 });

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: true },
      provider: ProviderEnum.system,
    },
  });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  await sendEmailOtp({ email, subject: emailEnum.forgetPassword });

  successResponse({
    res,
    message: "success",
  });
};
export const resetPassword = async (req, res, next) => {
  const { email, code, password } = req.body;
  if (!email) throw new Error("Email is required", { cause: 406 });
  const otpValue = await get(
    otp_key({ email, subject: emailEnum.forgetPassword }),
  );
  if (!otpValue) {
    throw new Error("otp expired");
  }

  if (!(await Compare({ plainText: code, cipherText: otpValue }))) {
    throw new Error("Invalid Otp", { cause: 400 });
  }

  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      email,
      confirmed: { $exists: true },
      provider: ProviderEnum.system,
    },
    update: {
      password: await Hash({ plainText: password }),
      changeCredential: new Date(),
    },
  });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  await deleteKey(otp_key({ email, subject: emailEnum.forgetPassword }));

  successResponse({
    res,
    message: "success",
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
      confirmed: { $exists: true },
      provider: ProviderEnum.system,
    },
  });
  if (!user) {
    //   return res.status(409).json({ message: "user not exist" });
    throw new Error("user not exist", { cause: 404 });
  }
  if (!(await Compare({ plainText: password, cipherText: user.password }))) {
    //   return res.status(409).json({ message: "Invalid Password" });
    throw new Error("Invalid Password", { cause: 400 });
  }
  const jwtid = randomUUID();

  const access_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: ACCESS_SECRET_KEY,
    options: { expiresIn: "1h", jwtid },
  });
  const refresh_token = GenerateToken({
    payload: { id: user._id, email: user.email },
    secret_key: REFRESH_SECRET_KEY,
    options: { expiresIn: "1y", jwtid },
  });

  successResponse({
    res,
    message: "sign in success",
    data: { access_token: access_token, refresh_token },
  });
};

export const getProfile = async (req, res, next) => {
  const { user } = req;
  const key = `profile::${user._id}`;
  const userExist = await get(key);
  if (userExist) {
    userExist.phone = decrypt(userExist.phone);
    // or ===> data:{...user._doc , phone:decrypt(user.phone)}

    return successResponse({ res, message: "user Profile", data: userExist });
  }

  await setValue({ key, value: user, ttl: 60 });

  user.phone = decrypt(user.phone);
  // or ===> data:{...user._doc , phone:decrypt(user.phone)}
  successResponse({ res, message: "user Profile", data: user });
};

export const refreshToken = async (req, res, next) => {
  const { authorization } = req.headers;
  console.log(authorization);

  if (!authorization) {
    throw new Error("token not exist");
  }

  const [prefix, token] = authorization.split(" ");

  if (prefix !== PREFIX) {
    throw new Error("Invalid token prefix");
  }

  const decoded = VerifyToken({
    token: token,
    secret_key: REFRESH_SECRET_KEY,
  });

  if (!decoded?.id) {
    throw new Error("Invalid token");
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: { _id: decoded.id },
    options: { select: "-password" },
  });

  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  const access_token = GenerateToken({
    payload: {
      id: user._id,
      email: user.email,
    },
    secret_key: ACCESS_SECRET_KEY,
    options: {
      expiresIn: "5m",
    },
  });

  return successResponse({
    res,
    message: "success",
    data: { access_token },
  });
};

export const shareProfile = async (req, res, next) => {
  const { id } = req.params;

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      id,
    },
    options: {
      select: "-password",
    },
  });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  user.phone = decrypt(user.phone);
  // or ===> data:{...user._doc , phone:decrypt(user.phone)}
  successResponse({ res, message: "success", data: user });
};

export const updatatProfile = async (req, res, next) => {
  const { firstName, lastName, phone, age, gender } = req.body;
  if (phone) {
    phone = encrypt(phone);
  }
  const user = await db_service.findOneAndUpdate({
    model: userModel,
    filter: {
      _id: req.user._id,
    },
    update: { firstName, lastName, phone, age, gender },
  });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }

  await deleteKey(`profile::${user._id}`);
  // user.phone = decrypt(user.phone);
  // or ===> data:{...user._doc , phone:decrypt(user.phone)}
  successResponse({ res, message: "updated success", data: user });
};

export const updatatPassword = async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!newPassword) {
    throw new Error("New password is required", { cause: 400 });
  }

  if (oldPassword === newPassword) {
    throw new Error("New password must be different", { cause: 400 });
  }

  if (
    !(await Compare({ plainText: oldPassword, cipherText: req.user.password }))
  ) {
    throw new Error("Invalid Password", { cause: 400 });
  }

  const hash = await Hash({ plainText: newPassword });

  req.user.password = hash;
  req.user.changeCredential = new Date();
  await req.user.save();

  // to remove new password from response
  req.user.password = undefined;

  successResponse({
    res,
    message: "Password updated successfully",
    data: req.user,
  });
};

export const logout = async (req, res, next) => {
  const { flag } = req.query;

  if (flag === "all") {
    req.user.changeCredential = new Date();
    await req.user.save();
    // await db_service.deleteMany({
    //   model: revokeTokenModel,
    //   filter: {
    //     userId: req.user._id,
    //   },
    // });
    await deleteKey(await keys(get_key({ userId: req.user._id })));
  } else {
    // await db_service.create({
    //   model: revokeTokenModel,
    //   data: {
    //     tokenId: req.decoded.jti,
    //     userId: req.user._id,
    //     expiredAt: new Date(req.decoded.exp * 1000 + 60 * 30 * 1000),
    //   },
    // });

    await setValue({
      key: revoked_key({ userId: req.user._id, jti: req.decoded.jti }),
      value: `${req.decoded.jti}`,
      ttl: req.decoded.exp - Math.floor(Date.now() / 1000),
    });
  }

  successResponse({ res });
};
