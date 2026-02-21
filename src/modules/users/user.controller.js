import { Router } from "express";
import * as US from "./user.service.js";
import * as UV from "./user.validation.js";
import { authentication } from "../../common/middleware/authentication.js";
import { RoleEnum } from "../../common/enum/user.enum.js";
import { authorization } from "../../common/middleware/authorization.js";
import { validation } from "../../common/middleware/validation.js";
const userRouter = Router();

userRouter.post("/signup", validation(UV.signUpSchema), US.signUp);
userRouter.post("/signup/gmail", US.signUpWithGmail);
userRouter.post("/signin", validation(UV.signInSchema), US.signIn);
userRouter.get(
  "/profile",
  authentication,
  authorization(RoleEnum.user),
  US.getProfile,
);

export default userRouter;
