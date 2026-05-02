import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { validateWebsiteExists } from "../validations/websiteValidation";
import {
  AccessibilityAIServiceController,
  AccessibilityController,
} from "../controllers/accessibilityController";

const router: Router = Router();

router.post(
  "/analyze-accessibility",
  AccessibilityController.analyzeAccessibility
);

// POST - Save accessibility results
router.post(
  "/:websiteId/accessibility",
  authenticate,
  validateWebsiteExists,
  AccessibilityController.saveAccessibilityResults
);

// GET - Get accessibility results
router.get(
  "/:websiteId/accessibility",
  authenticate,
  validateWebsiteExists,
  AccessibilityController.getAccessibilityResults
);

// POST - Give all the recommendations for the issues
router.post(
  "/:websiteId/recommendations",
  authenticate,
  AccessibilityAIServiceController.generateAccessibilityRecommendations
);

// POST - Generate code fixes for accessibility issues
router.post(
  "/generate-fixes",
  authenticate,
  AccessibilityAIServiceController.generateCodeFixes
);

export default router;
