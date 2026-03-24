import { Request, Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import {
  AccessibilityService,
} from "../services/accessibilityService";
import { AccessibilityAIRecommendationService } from "../services/aiService";
import { AccessibilityService as AccessibilityDataService } from "../services/accessibilityDataService";
import dotenv from "dotenv";
import { sendError, sendSuccess } from "../types/response";
dotenv.config();

export class AccessibilityController {

  // takes HTML code and checks it for accessibility problems RIGHT NOW, but doesn't save anything to the database.
  // this is for extension
  static async analyzeAccessibility(req: Request, res: Response) {
    try {
      const { html } = req.body;
      if (!html) {
        return sendError(res, 400, "HTML content required", "VALIDATION_ERROR");
      }

      const issues = await AccessibilityService.analyzeHtml(html);
      return sendSuccess(res, { issues });
    } catch (error: any) {
      return sendError(
        res,
        500,
        "Failed to analyze accessibility",
        "SERVER_ERROR"
      );
    }
  }

  //Takes accessibility issues that were ALREADY analyzed from the extension and saves them to the database.
  static async saveAccessibilityResults(req: AuthRequest, res: Response) {
    try {
      const { issues, analyzedAt } = req.body;
      if (!issues || !analyzedAt || !Array.isArray(issues)) {
        console.log("Missing issues or analyzedAt or issues is not an array");
        return sendError(
          res,
          400,
          "Issues (array) and analyzedAt required",
          "VALIDATION_ERROR"
        );
      }

      if (Array.isArray(issues) && issues.length === 0) {
        console.log(
          "Received empty issues array. Skipping overwrite to preserve previous results."
        );
        return sendError(
          res,
          400,
          "No accessibility issues provided. Skipping update.",
          "VALIDATION_ERROR"
        );
      }

      if (!req.params.websiteId || !req.userId) {
        return sendError(
          res,
          400,
          "Website ID and User ID are required",
          "VALIDATION_ERROR"
        );
      }

      console.log("Looking for existing snapshot...");

      const snapshot = await AccessibilityDataService.saveAccessibilityResults({
        websiteId: req.params.websiteId,
        userId: req.userId,
        issues,
        analyzedAt,
      });

      console.log("Snapshot updated successfully");

      return sendSuccess(
        res,
        {
          snapshotId: snapshot._id.toString(),
          issues: snapshot.accessibilityIssues,
        },
        "Accessibility results saved successfully",
        undefined,
        201
      );
    } catch (error: any) {
      console.error("Accessibility save error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
      return sendError(
        res,
        500,
        "Failed to save accessibility results",
        "SERVER_ERROR",
        error.message
      );
    }
  }

  //get the results in the website details page
  static async getAccessibilityResults(req: AuthRequest, res: Response) {
    try {
      console.log("=== Accessibility Get Request ===");
      console.log("Website ID:", req.params.websiteId);
      console.log("User ID:", req.userId);

      if (!req.params.websiteId || !req.userId) {
        return sendError(
          res,
          400,
          "Website ID and User ID are required",
          "VALIDATION_ERROR"
        );
      }

      // Check cache first
      const cachedData = await AccessibilityDataService.getCachedAccessibilityResults(req.params.websiteId, req.userId!);
      if (cachedData) {
        console.log("Cache HIT for accessibility results");
        return sendSuccess(res, cachedData, "Accessibility results retrieved from cache");
      } else {
        console.log("Cache MISS for accessibility results");
      }

      const responseData = await AccessibilityDataService.getAccessibilityResults(req.params.websiteId, req.userId!);

      if (!responseData) {
        console.log("No accessibility results found");
        return sendError(
          res,
          404,
          "No accessibility results found",
          "NOT_FOUND"
        );
      }

      console.log(
        "Found accessibility results:",
        responseData.issues.length,
        "issues"
      );

      //cache the response for 10 minutes
      await AccessibilityDataService.cacheAccessibilityResults(req.params.websiteId, req.userId!, responseData);

      return sendSuccess(res, responseData);
    } catch (error: any) {
      console.error("Accessibility get error:", error);
      return sendError(res, 500, "Server error", "SERVER_ERROR", error.message);
    }
  }
}

//these are AI Suggestions for Fixing Issues
export class AccessibilityAIServiceController {
  static async generateAccessibilityRecommendations(
    req: AuthRequest,
    res: Response
  ) {
    try {
      const { issues } = req.body;
      const recommendations =
        await AccessibilityAIRecommendationService.generateRecommendations(
          issues
        );

      if (
        !recommendations ||
        (typeof recommendations === "string" &&
          recommendations.trim().length === 0)
      ) {
        console.error(
          "AI returned empty accessibility recommendations for issues:",
          issues
        );
        return sendError(
          res,
          502,
          "AI service returned an empty response. Please try again later or check AI configuration.",
          "AI_EMPTY"
        );
      }

      return sendSuccess(res, { recommendations });
    } catch (error: any) {
      console.error("Error generating AI recommendations:", error);

      if (error.message.includes("No accessibility issues provided")) {
        return sendError(res, 400, error.message, "VALIDATION_ERROR");
      }

      if (error.message.includes("Google API key missing")) {
        return sendError(res, 500, error.message, "CONFIG_ERROR");
      }

      if (error.message.includes("temporarily overloaded")) {
        return sendError(res, 503, error.message, "AI_OVERLOADED", {
          retryAfter: 60,
        });
      }

      return sendError(
        res,
        500,
        error.message || "Failed to generate AI recommendations",
        "SERVER_ERROR"
      );
    }
  }

  static async generateCodeFixes(req: AuthRequest, res: Response) {
    try {
      const { issues } = req.body;

      if (!issues || !Array.isArray(issues) || issues.length === 0) {
        return sendError(res, 400, "Issues array required", "VALIDATION_ERROR");
      }

      console.log(`Generating code fixes for ${issues.length} issues...`);

      const codeFixes =
        await AccessibilityAIRecommendationService.generateCodeFixes(issues);

      if (!codeFixes || codeFixes.length === 0) {
        return sendError(
          res,
          502,
          "AI service could not generate code fixes. Please try again later.",
          "AI_EMPTY"
        );
      }

      console.log(`Generated ${codeFixes.length} code fixes`);

      return sendSuccess(res, { codeFixes });
    } catch (error: any) {
      console.error("Error generating code fixes:", error?.message || error);

      if (error.message.includes("Missing") && error.message.includes("API")) {
        return sendError(
          res,
          500,
          "AI service configuration error",
          "CONFIG_ERROR"
        );
      }

      return sendError(
        res,
        500,
        error?.message || "Failed to generate code fixes",
        "SERVER_ERROR"
      );
    }
  }
}
