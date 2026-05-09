import { Question } from "../models/Question.js";
import { User } from "../models/User.js";
import { HttpError } from "../middleware/errorHandler.js";

export async function sendQuestion(req, res, next) {
  try {
    const username = req.params.username;
    const body = req.body.body;

    const recipient = await User.findOne({ username });
    if (!recipient) return next(new HttpError(404, "Missing Recipient"));

    if (recipient.acceptingQuestions === false)
      return next(new HttpError(403, { message: "Not Accepting Questions" }));
    const question = await Question.create({
      recipient: recipient._id,
      body: body,
    });

    const response = question.toObject();
    delete response.recipient;
    res.json(201).json(response);
  } catch (err) {
    next(err);
  }
}

export async function listInbox(req, res, next) {
  try {
    const filter = {
      recipient: req.user._id,
    };
    const { status, page = 1, limit = 20 } = req.query;
    const statusGroup = ["pending", "answered", "ignored"];
    if (status) {
      if (!statusGroup.includes(status)) {
        return next(new HttpError(400, "Invalid Status"));
      }
      filter.status = status;
    }

    const pageNum = Math.max(1, +page);
    const limitNum = Math.min(50, Math.max(1, +limit));
    const skip = (pageNum - 1) * limitNum;

    const data = await Question.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await Question.countDocuments(filter);

    return res.status(200).json({
      data,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(err);
  }
}

async function getOwnedQuestion(id, userId) {
  const question = await Question.findById({ _id: id });
  if (!question) throw new HttpError(404, "Question not found");
  if (String(question.recipient) !== String(userId))
    throw new HttpError(403, "Forbidden");

  return question;
}

export async function answerQuestion(req, res, next) {
  try {
    const question = await getOwnedQuestion(req.params.id, req.user.id);
    question.answer = req.body.answer;
    question.answeredAt = Date.now();
    question.status = "answered";
    if (req.body.visibility) question.visibility = req.body.visibility;
    const saved = await question.save();
    return res.status(200).json(saved); // user and question
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req, res, next) {
  try {
    const question = await getOwnedQuestion(req.params.id, req.user.id);
    const { answer, status, visibility } = req.body;

    if (status) question.status = req.body.status;
    if (visibility) question.visibility = req.body.visibility;
    if (answer) {
      question.answer = req.body.answer;
      question.answeredAt = Date.now();
      question.status = "answered";
    }
    const saved = await question.save();
    return res.status(200).json(saved);
  } catch (error) {
    next(error);
  }
}

export async function removeQuestion(req, res, next) {
  try {
    const question = await getOwnedQuestion(req.params.id, req.user.id);
    await Question.deleteOne({ _id: req.params.id });
    return res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listPublicFeed(req, res, next) {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) return res.status(404).json("User not Found");
    const filter = {
      recipient: user._id,
      status: "answered",
      visibility: "public",
    };
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, +page);
    const limitNum = Math.min(50, Math.max(1, +limit));
    const skip = (pageNum - 1) * limitNum;

    const data = await Question.find(filter)
      .select("-recipient")
      .sort({ answeredAt: -1 })
      .skip(skip)
      .limit(limitNum);
    const total = await Question.countDocuments(filter);

    return res.status(200).json({
      data,
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err) {
    next(new HttpError(404, "User not found"));
  }
}
