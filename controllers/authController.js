import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function signup(req, res, next) {
  try {
    const { username, email, password, displayName } = req.body;
    const userExist = await User.findOne({ $or: [{ email }, { username }] });
    if (userExist) return res(409).json("Email or username already taken");
    const hashed = await User.hashPassword(password);
    const user = await User.create({
      username,
      email,
      passwordHash: hashed,
      displayName,
    });
    const token = signToken(user);
    res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === 11000)
      return res.status(409).json("Email or username already taken");
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return next(new HttpError(401, "Invalid email or password"));
    const valid = await user.comparePassword(password);
    if (!valid) return next(new HttpError(401, "Invalid email or password"));
    const token = signToken(user);
    res.json({ token, user });
  } catch (error) {
    next(error);
  }
}

export async function me(req, res) {
  res.status(200).json(req.user);
}
