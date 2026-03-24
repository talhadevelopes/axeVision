import { Router } from "express";
import { ChatbotController } from "../controllers/chatbotController";
import { authenticate } from "../middleware/authMiddleware";
const router: Router = Router();

// POST /api/chat - Send chat message
router.post("/", authenticate, ChatbotController.chat);

// GET /api/chat/suggestions/:snapshotId - Get suggested questions
router.get(
  "/suggestions/:snapshotId",
  authenticate,
  ChatbotController.getSuggestedQuestions
);

export default router;