import { VerifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
export const authentication = async (req, res, next) => {
  const { authentication } = req.headers;
  if (!authentication) {
    throw new Error("token not exist");
  }
  const [prefix, token] = authentication.split(" ");
  if (prefix !== "Bearer") {
    throw new Error("inValid token Prefix");
  }

  const decoded = VerifyToken({
    token: token,
    secret_key: "asdfghjkl123",
  });

  if (!decoded || !decoded?.id) {
    throw new Error("inValid token");
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      _id: decoded.id,
    },
    options: {
      select: "-password",
    },
  });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }
  req.user = user;
  next();
};
