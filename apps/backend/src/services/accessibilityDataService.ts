import { prisma } from "../utils/prisma";
import { redisClient } from "../utils/redis";

export class AccessibilityService {

  //Save accessibility results to a snapshot
  static async saveAccessibilityResults(params: {
    websiteId: string;
    userId: string;
    issues: any[];
    analyzedAt: string;
  }) {
    const { websiteId, userId, issues, analyzedAt } = params;

    // Finding existing snapshot first
    const existingSnapshot = await prisma.snapshot.findFirst({
      where: { websiteId, userId },
      orderBy: { capturedAt: "desc" },
    });

    let snapshot: any;
    if (existingSnapshot) {
      // Delete existing accessibility issues first
      await prisma.accessibilityIssue.deleteMany({
        where: { snapshotId: existingSnapshot.id },
      });

      // Create new accessibility issues
      await prisma.accessibilityIssue.createMany({
        data: issues.map((issue: any) => ({
          snapshotId: existingSnapshot.id,
          type: issue.type || "unknown",
          message: issue.message || issue.description || "No description",
          source: issue.source,
          context: issue.context,
          selector: issue.selector,
        })),
      });

      // Update the snapshot's analyzedAt
      const updated = await prisma.snapshot.update({
        where: { id: existingSnapshot.id },
        data: { analyzedAt: new Date(analyzedAt) },
      });

      // Get accessibility issues separately
      const accessibilityIssues = await prisma.accessibilityIssue.findMany({
        where: { snapshotId: existingSnapshot.id },
      });
      snapshot = {
        ...updated,
        _id: updated.id,
        accessibilityIssues: accessibilityIssues.map((i) => ({
          ...i,
          _id: i.id,
        })),
      };
    } else {
      // Create a new snapshot with accessibility results
      const created = await prisma.snapshot.create({
        data: {
          websiteId,
          userId,
          capturedAt: new Date(),
          contentPreview: "Accessibility analysis results",
          analyzedAt: new Date(analyzedAt),
        },
      });

      // Create accessibility issues
      await prisma.accessibilityIssue.createMany({
        data: issues.map((issue: any) => ({
          snapshotId: created.id,
          type: issue.type || "unknown",
          message: issue.message || issue.description || "No description",
          source: issue.source,
          context: issue.context,
          selector: issue.selector,
        })),
      });

      const accessibilityIssues = await prisma.accessibilityIssue.findMany({
        where: { snapshotId: created.id },
      });

      snapshot = {
        ...created,
        _id: created.id,
        accessibilityIssues: accessibilityIssues.map((i) => ({
          ...i,
          _id: i.id,
        })),
      };
    }

    // Invalidate cache
    try {
      const cacheKey = `accessibility:${userId}:${websiteId}`;
      await redisClient.del(cacheKey);
    } catch (redisErr: any) {
      console.warn("Failed to invalidate accessibility cache:", redisErr?.message || redisErr);
    }

    return snapshot;
  }

  //Get accessibility results for a website
  static async getAccessibilityResults(websiteId: string, userId: string) {
    // Find snapshot with accessibility issues
    const snapshot = await prisma.snapshot.findFirst({
      where: {
        websiteId,
        userId,
        analyzedAt: { not: null },
      },
      orderBy: { analyzedAt: "desc" },
    });

    let accessibilityIssues: any[] = [];
    if (snapshot) {
      accessibilityIssues = await prisma.accessibilityIssue.findMany({
        where: { snapshotId: snapshot.id },
      });
    }

    if (!snapshot || !accessibilityIssues || accessibilityIssues.length === 0) {
      return null;
    }

    return {
      issues: accessibilityIssues.map((i) => ({
        ...i,
        _id: i.id,
      })),
      analyzedAt: snapshot.analyzedAt,
    };
  }


  //Cache accessibility results

  static async cacheAccessibilityResults(websiteId: string, userId: string, data: any) {
    try {
      const cacheKey = `accessibility:${userId}:${websiteId}`;
      await redisClient.setex(cacheKey, 600, JSON.stringify(data));
    } catch (redisErr: any) {
      console.warn("Failed to set accessibility cache, ignoring:", redisErr?.message || redisErr);
    }
  }
  //Get cached accessibility results   
  static async getCachedAccessibilityResults(websiteId: string, userId: string) {
    try {
      const cacheKey = `accessibility:${userId}:${websiteId}`;
      const cachedData = await redisClient.get(cacheKey);
      if (cachedData) {
        return typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
      }
    } catch (redisErr: any) {
      console.warn("Redis get failed for accessibility cache, continuing without cache:", redisErr?.message || redisErr);
    }
    return null;
  }
}
