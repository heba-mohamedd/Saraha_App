export const authorization = (roles = []) => {
  return async (req, res, next) => {
    console.log(roles);

    if (!roles.includes(req.user.role)) {
      throw new Error("UnAuthorized", { cause: 403 });
    }

    next();
  };
};
