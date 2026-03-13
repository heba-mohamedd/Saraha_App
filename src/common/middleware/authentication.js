import { VerifyToken } from "../utils/token.service.js";
import * as db_service from "../../DB/db.service.js";
import userModel from "../../DB/models/user.model.js";
import { ACCESS_SECRET_KEY, PREFIX } from "../../../config/config.service.js";
import revokeTokenModel from "../../DB/models/revokeToken.model.js";
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
  if (user?.changeCredential?.getTime() > decoded.iat * 1000) {
    throw new Error("inValid token");
  }

  const revokeToken = await db_service.findOne({
    model: revokeTokenModel,
    filter: {
      tokenId: decoded.jti,
    },
  });

  if (revokeToken) {
    throw new Error("inValid token revoked");
  }
  req.user = user;
  req.decoded = decoded;
  next();
};

// decoded >>>payload {
//   "id": "69ad8bf93c7f1e277f749a28",
//   "email": "heba111@gmail.com",
//   "iat": 1773243739,
//   "exp": 1773247339,
//   "jti": "9d8026b8-3970-47e9-97b7-f72be8d64a30"
// }
