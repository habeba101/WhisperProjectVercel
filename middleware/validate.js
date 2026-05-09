import { HttpError } from "./errorHandler.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    return next(
      new HttpError(400, "Validation Failed", {
        details: result.error.format(),
      }),
    );
  } else {
    req.body = result.data;
    next();
  }
};
