import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { sendError, sendSuccess } from "../utils/response";
import type { WebsiteDTO } from "@axeVision/shared";
import { WebsiteService } from "../services/websiteService";
import { Prisma } from "../generated/prisma/client";

//this is the parent container for all snapshots and accessibility
export class WebsiteController {
  //used in extension when capturing snapshot
  static async createWebsite(req: AuthRequest, res: Response) {
    try {
      console.log("=== Website Creation Request ===");
      console.log("User ID:", req.userId);
      console.log("Request body:", req.body);

      const { url, name, title } = req.body;

      if (!url) {
        console.log("No URL provided");
        return sendError(res, 400, "URL is required", "VALIDATION_ERROR");
      }

      //clean and validate URL (enforce DB limits: url 255, name 100)
      const cleanUrl = url.trim().slice(0, 255);
      console.log("Clean URL:", cleanUrl);

      //check if user is authenticated
      if (!req.userId) {
        console.log("No user ID in request");
        return sendError(res, 401, "User not authenticated", "UNAUTHORIZED");
      }

      console.log("Checking for existing website...");
      const existingWebsite = await WebsiteService.findWebsiteByUrl(cleanUrl, req.userId);

      if (existingWebsite) {
        console.log("Website already exists:", existingWebsite.id);
        //return the websiteId when website already exists
        const data: WebsiteDTO = {
          id: existingWebsite.id,
          url: existingWebsite.url,
          name: existingWebsite.name,
          createdAt: existingWebsite.createdAt.toISOString(),
        };
        return sendSuccess(
          res,
          data,
          "Website already tracked",
          undefined,
          409
        );
      }

      console.log("Creating new website...");
      const websiteData = {
        url: cleanUrl,
        name: (name || title || cleanUrl).slice(0, 100),
        userId: req.userId,
        createdAt: new Date(),
        isActive: true,
      };

      console.log("Website data to save:", websiteData);

      const website = await WebsiteService.createWebsite(websiteData);

      console.log("Website created successfully:", website.id);
      const data: WebsiteDTO = {
        id: website.id,
        url: website.url,
        name: website.name,
        createdAt: website.createdAt.toISOString(),
      };
      return sendSuccess(res, data, "Website created", undefined, 201);
    } catch (error: any) {
      console.error("Website creation error:", error);
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);

      if (error.name === "ValidationError") {
        console.error("Validation errors:", error.message);
        return sendError(
          res,
          400,
          "Validation failed",
          "VALIDATION_ERROR",
          error.message
        );
      }

      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        console.error("Duplicate key error:", error.meta);
        return sendError(res, 409, "Website already exists", "DUPLICATE");
      }

      return sendError(
        res,
        500,
        "Server error creating website",
        "SERVER_ERROR",
        error.message
      );
    }
  }

  //get all the websites in /websites page
  static async getWebsites(req: AuthRequest, res: Response) {
    try {
      //try to use Redis cache
      const cachedData = await WebsiteService.getCachedUserWebsites(req.userId!);
      if (cachedData) {
        console.log("Cache HIT for websites");
        return sendSuccess(res, cachedData, "Websites retrieved from cache");
      } else {
        console.log("Cache MISS for websites");
      }

      const data = await WebsiteService.getUserWebsites(req.userId!);

      //cache the response for 10 minutes (600 seconds)
      await WebsiteService.cacheUserWebsites(req.userId!, data);

      return sendSuccess(res, data, "Websites retrieved successfully");
    } catch (error: any) {
      return sendError(res, 500, "Failed to fetch websites", "SERVER_ERROR");
    }
  }
}
