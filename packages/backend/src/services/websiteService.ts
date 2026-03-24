import { Website, Snapshot } from "../models";
import type { WebsiteDTO } from "@axeVision/shared";
import { redisClient } from "../utils/redis";

export class WebsiteService {
  /**
   * Find a website by URL and user ID
   */
  static async findWebsiteByUrl(url: string, userId: string) {
    return await Website.findOne({
      url,
      userId,
    });
  }

  /**
   * Create a new website
   */
  static async createWebsite(websiteData: {
    url: string;
    name: string;
    userId: string;
    createdAt: Date;
    isActive: boolean;
  }) {
    const website = await Website.create(websiteData);
    
    // Invalidate cache
    try {
      const cacheKey = `websites:${websiteData.userId}`;
      await redisClient.del(cacheKey);
      console.log("Invalidated websites cache for user", websiteData.userId);
    } catch (redisErr: any) {
      console.warn(
        "Failed to invalidate websites cache:",
        redisErr?.message || redisErr
      );
    }

    return website;
  }

  /**
   * Get all websites for a user with their latest snapshot information
   */
  static async getUserWebsites(userId: string) {
    const websites = await Website.find({
      userId,
      isActive: true,
    });

    const websitesWithSnapshots = await Promise.all(
      websites.map(async (website) => {
        const latestSnapshot = await Snapshot.findOne(
          { websiteId: website._id.toString(), userId },
          { capturedAt: 1 }
        ).sort({ capturedAt: -1 });
        
        return {
          id: website._id.toString(),
          url: website.url,
          name: website.name,
          createdAt: website.createdAt.toISOString(),
          latestSnapshot: latestSnapshot?.capturedAt 
            ? latestSnapshot.capturedAt.toISOString() 
            : null,
        } as WebsiteDTO;
      })
    );

    return websitesWithSnapshots;
  }

  /**
   * Cache websites data
   */
  static async cacheUserWebsites(userId: string, data: WebsiteDTO[]) {
    try {
      await redisClient.setex(
        `websites:${userId}`,
        600,
        JSON.stringify(data)
      );
    } catch (redisErr: any) {
      console.warn(
        "Failed to set websites cache, ignoring:",
        redisErr?.message || redisErr
      );
    }
  }

  /**
   * Get cached websites data
   */
  static async getCachedUserWebsites(userId: string): Promise<WebsiteDTO[] | null> {
    try {
      const cacheKey = `websites:${userId}`;
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        //@ts-ignore
        return typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      }
    } catch (redisErr: any) {
      console.warn("Redis get failed, continuing without cache:", redisErr?.message || redisErr);
    }
    return null;
  }
}
