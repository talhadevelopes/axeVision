import { Snapshot, AccessibilityIssue } from "../models";
import { redisClient } from "../utils/redis";

export class AccessibilityService {
  /**
   * Save accessibility results to a snapshot
   */
  static async saveAccessibilityResults(params: {
    websiteId: string;
    userId: string;
    issues: any[];
    analyzedAt: string;
  }) {
    const { websiteId, userId, issues, analyzedAt } = params;

    // Finding existing snapshot first
    const existingSnapshot = await Snapshot.findOne({
      websiteId,
      userId,
    }).sort({ capturedAt: -1 });

    let snapshot: any;
    if (existingSnapshot) {
      // Delete existing accessibility issues first
      await AccessibilityIssue.deleteMany({
        snapshotId: existingSnapshot._id.toString(),
      });

      // Create new accessibility issues
      await AccessibilityIssue.insertMany(
        issues.map((issue: any) => ({
          snapshotId: existingSnapshot._id.toString(),
          type: issue.type || "unknown",
          message: issue.message || issue.description || "No description",
          source: issue.source,
          context: issue.context,
          selector: issue.selector,
        }))
      );

      // Update the snapshot's analyzedAt
      snapshot = await Snapshot.findByIdAndUpdate(
        existingSnapshot._id,
        { analyzedAt: new Date(analyzedAt) },
        { new: true }
      );

      // Get accessibility issues separately
      const accessibilityIssues = await AccessibilityIssue.find({
        snapshotId: existingSnapshot._id.toString(),
      });
      snapshot = { ...snapshot!.toObject(), accessibilityIssues };
    } else {
      // Create a new snapshot with accessibility results
      snapshot = await Snapshot.create({
        websiteId,
        userId,
        capturedAt: new Date(),
        contentPreview: "Accessibility analysis results",
        analyzedAt: new Date(analyzedAt),
      });

      // Create accessibility issues
      const accessibilityIssues = await AccessibilityIssue.insertMany(
        issues.map((issue: any) => ({
          snapshotId: snapshot._id.toString(),
          type: issue.type || "unknown",
          message: issue.message || issue.description || "No description",
          source: issue.source,
          context: issue.context,
          selector: issue.selector,
        }))
      );

      snapshot = { ...snapshot.toObject(), accessibilityIssues };
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

  /**
   * Get accessibility results for a website
   */
  static async getAccessibilityResults(websiteId: string, userId: string) {
    // Find snapshot with accessibility issues
    const snapshot = await Snapshot.findOne({
      websiteId,
      userId,
      analyzedAt: { $exists: true },
    }).sort({ analyzedAt: -1 });

    let accessibilityIssues: any[] = [];
    if (snapshot) {
      accessibilityIssues = await AccessibilityIssue.find({
        snapshotId: snapshot._id.toString(),
      });
    }

    if (!snapshot || !accessibilityIssues || accessibilityIssues.length === 0) {
      return null;
    }

    return {
      issues: accessibilityIssues,
      analyzedAt: snapshot.analyzedAt,
    };
  }

  /**
   * Cache accessibility results
   */
  static async cacheAccessibilityResults(websiteId: string, userId: string, data: any) {
    try {
      const cacheKey = `accessibility:${userId}:${websiteId}`;
      await redisClient.setex(cacheKey, 600, JSON.stringify(data));
    } catch (redisErr: any) {
      console.warn("Failed to set accessibility cache, ignoring:", redisErr?.message || redisErr);
    }
  }

  /**
   * Get cached accessibility results
   */
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
