import { VerifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { ACCESS_SECRET_KEY, PREFIX } from "../../../config/config.service.js";
export const authentication = async (req, res, next) => {
  const { authentication } = req.headers;
  if (!authentication) {
    throw new Error("token not exist");
  }
  const [prefix, token] = authentication.split(" ");
  if (prefix !== PREFIX) {
    throw new Error("inValid token Prefix");
  }

  const decoded = VerifyToken({
    token: token,
    secret_key: ACCESS_SECRET_KEY,
  });

  if (!decoded || !decoded?.id) {
    throw new Error("inValid token");
  }

  const user = await db_service.findOne({
    model: userModel,
    filter: {
      _id: decoded.id,
    },
  });
  if (!user) {
    throw new Error("user not exist", { cause: 404 });
  }
  req.user = user;
  next();
};
