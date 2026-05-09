import { User } from "../models/User.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function getPublicProfile(req, res, next) {
  // TODO:
  // Hint: User.findOne({ username }). 404 if missing. Exclude email + passwordHash from response.
  // See: docs/API.md "GET /api/users/:username", tester/tests/profile.test.js
  try {
    const username = req.params.username;
    const user = await User.findOne({ username }).select({
      email: 0,
      passwordHash: 0,
    });
    if (!user) return res.status(404).json("User not found");

    return res.json(user);
  } catch (err) {
    next(err);
  }
}

export async function updateMe(req, res, next) {
  try {
    const { displayName, bio, avatarUrl, acceptingQuestions, tags } = req.body;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      { displayName, bio, avatarUrl, acceptingQuestions, tags },
      { new: true, runValidators: true },
    );
    return res.json(updated);
  } catch (err) {
    next(err);
  }
}
