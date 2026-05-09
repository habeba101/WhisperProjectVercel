import { Router } from "express";
import { authenticate } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { profileUpdateSchema } from "../validations/userSchema.js";
import { createQuestionSchema } from "../validations/questionSchema.js";
import { getPublicProfile, updateMe } from "../controllers/userController.js";
import {
  sendQuestion,
  listPublicFeed,
} from "../controllers/questionController.js";

const router = Router();

router.patch("/me", authenticate, validate(profileUpdateSchema), updateMe);
router.get("/:username", getPublicProfile);
router.post(
  "/:username/questions",
  validate(createQuestionSchema),
  sendQuestion,
);
router.get("/:username/questions", listPublicFeed);

export default router;
