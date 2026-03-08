export const validation = (schema) => {
  return (req, res, next) => {
    let errorResultes = [];
    for (const key of Object.keys(schema)) {
      const { error } = schema[key].validate(req[key], { abortEarly: false });
      if (error) {
        error.details.forEach((element) => {
          errorResultes.push({
            key,
            path: element.path[0],
            message: element.message,
          });
        });
      }
    }

    // if (errorResultes.length) {
    //   return res.status(400).json({
    //     message: "Validation Error",
    //     error: errorResultes[0].map((err) => err.message),
    //   });
    // }
    if (errorResultes.length) {
      return res.status(400).json({
        message: "Validation Error",
        error: errorResultes,
      });
    }

    next();
  };
};
