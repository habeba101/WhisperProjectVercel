import jwt from "jsonwebtoken";
import { User } from "../models/User.js";
import { HttpError } from "./errorHandler.js";
export async function authenticate(req, _res, next) {
  const authHeader = req.header("Authorization");
  if (!authHeader) return next(new HttpError(401, "Access Denied"));
  const token = authHeader.split(" ")[1];

  if (!token) return next(new HttpError(401, "Access Denied"));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.sub);
    if (!user) return next(new HttpError(401, "Access Denied"));

    req.user = user;
    next();
  } catch (error) {
    return next(new HttpError(401, "Access Denied"));
  }
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });
}
