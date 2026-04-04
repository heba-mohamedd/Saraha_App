import { Router } from "express";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import { authentication } from "../../common/middleware/authentication.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { authorization } from "../../common/middleware/authorization.js";
import { validation } from "../../common/middleware/validation.js";
import { multer_host, multer_local } from "../../common/middleware/multer.js";
import { multer_enum } from "../../common/enum/multer.enum.js";

const userRouter = Router();

// use it when upload in loacl
// userRouter.post(
//   "/signup",
//   multer_local({
//     custom_path: "users",
//     custom_types: [...multer_enum.image, ...multer_enum.video],
//   }).fields([
//     { name: "attachment", maxCount: 1 },
//     {
//       name: "attachments",
//       maxCount: 4,
//     },
//   ]),
//   US.signUp,
// );

userRouter.post(
  "/signup",
  multer_host({
    custom_types: [...multer_enum.image],
  }).fields([
    { name: "attachment", maxCount: 1 },
    {
      name: "attachments",
      maxCount: 4,
    },
  ]),
  validation(UV.signUpSchema),
  US.signUp,
);
userRouter.patch(
  "/confirm-email",
  validation(UV.confirmEmailSchema),
  US.confirmEmail,
);

userRouter.patch(
  "/forget-password",
  validation(UV.resendOtpSchema),
  US.forgetPassword,
);
userRouter.patch(
  "/reset-password",
  validation(UV.resetPasswordSchema),
  US.resetPassword,
);

userRouter.patch("/resend-otp", validation(UV.resendOtpSchema), US.resendOtp);
userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.post("/signin", validation(UV.signInSchema), US.signIn);
userRouter.get("/refresh_token", US.refreshToken);

userRouter.get(
  "/profile",
  authentication,
  authorization(RoleEnum.user),
  US.getProfile,
);

userRouter.patch(
  "/updata-profile",
  authentication,
  authorization(RoleEnum.user),
  US.updatatProfile,
);

userRouter.get(
  "/share-profile/:id",
  validation(UV.shareProfileSchema),
  US.shareProfile,
);

userRouter.patch(
  "/updata-password",
  authentication,
  authorization(RoleEnum.user),
  validation(UV.updataPasswordSchema),
  US.updatatPassword,
);

userRouter.get("/logout", authentication, US.logout);
export default userRouter;
