import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Website, Snapshot } from "../models";
import { sendError, sendSuccess } from "../types/response";
import type { WebsiteDTO } from "@axeVision/shared";
import { redisClient } from "../utils/redis";

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
      const existingWebsite = await Website.findOne({
        url: cleanUrl,
        userId: req.userId,
      });

      if (existingWebsite) {
        console.log("Website already exists:", existingWebsite.id);
        //return the websiteId when website already exists
        const data: WebsiteDTO = {
          id: existingWebsite._id.toString(),
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

      const website = await Website.create(websiteData);

      //invalidate cached websites list for this user so the new website shows up immediately
      try {
        const cacheKey = `websites:${req.userId}`;
        if (redisClient?.isOpen) {
          await redisClient.del(cacheKey);
          console.log("Invalidated websites cache for user", req.userId);
        }
      } catch (redisErr: any) {
        console.warn(
          "Failed to invalidate websites cache:",
          redisErr?.message || redisErr
        );
      }

      console.log("Website created successfully:", website.id);
      const data: WebsiteDTO = {
        id: website._id.toString(),
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

      if (error.code === 11000) {
        console.error("Duplicate key error:", error.keyValue);
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
      const cacheKey = `websites:${req.userId}`;
      if (redisClient?.isOpen) {
        try {
          const cachedData = await redisClient.get(cacheKey);
          if (cachedData) {
            console.log("Cache HIT for websites");
            try {
              const parsed = JSON.parse(cachedData);
              return sendSuccess(res, parsed, "Websites retrieved from cache");
            } catch (parseErr) {
              console.warn(
                "Failed to parse cached websites JSON, ignoring cache:",
                parseErr
              );
              // fall through to DB fetch
            }
          } else {
            console.log("Cache MISS for websites");
          }
        } catch (redisErr: any) {
          console.warn(
            "Redis get failed, continuing without cache:",
            redisErr?.message || redisErr
          );
          // fall through to DB fetch
        }
      } else {
        console.log("Redis client not open, skipping cache");
      }

      const websites = await Website.find({
        userId: req.userId,
        isActive: true,
      });

      const websitesWithSnapshots = await Promise.all(
        websites.map(async (website) => {
          const latestSnapshot = await Snapshot.findOne(
            { websiteId: website._id.toString(), userId: req.userId },
            { capturedAt: 1 }
          ).sort({ capturedAt: -1 });
          return {
            ...website.toObject(),
            latestSnapshot: latestSnapshot?.capturedAt || null,
          };
        })
      );

      const data: WebsiteDTO[] = websitesWithSnapshots.map((website) => ({
        id: website._id.toString(),
        url: website.url,
        name: website.name,
        createdAt: website.createdAt.toISOString(),
        latestSnapshot: website.latestSnapshot
          ? website.latestSnapshot.toISOString()
          : null,
      }));

      //cache the response for 10 minutes (600 seconds)
      try {
        if (redisClient?.isOpen) {
          await redisClient.setEx(
            `websites:${req.userId}`,
            600,
            JSON.stringify(data)
          );
        }
      } catch (redisErr: any) {
        console.warn(
          "Failed to set websites cache, ignoring:",
          redisErr?.message || redisErr
        );
      }

      return sendSuccess(res, data, "Websites retrieved successfully");
    } catch (error: any) {
      return sendError(res, 500, "Failed to fetch websites", "SERVER_ERROR");
    }
  }
}
