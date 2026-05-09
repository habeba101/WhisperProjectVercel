import { Question } from "../models/Question.js";
import { User } from "../models/User.js";

export async function listGlobalFeed(req, res, next) {
  try {
    let filter = {
      status: "answered",
      visibility: "public",
    };
    const { tag, page = 1, limit = 20 } = req.query;
    if (tag) {
      const ids = await User.find({ tags: tag }).distinct("_id");
      if (ids.length === 0) {
        return res.status(200).json({
          data: [],
          page: 1,
          limit,
          total: 0,
          totalPages: 0,
        });
      }
      filter.recipient = { $in: ids };
    }

    const skip = (page - 1) * limit;
    const data = await Question.find(filter)
      .populate("recipient", "username displayName avatarUrl tags")
      .sort({ answeredAt: -1 })
      .skip(skip)
      .limit(limit);
    const total = await Question.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);
    res.status(200).json({
      data: data,
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages,
    });
  } catch (err) {
    next(err);
  }
}
