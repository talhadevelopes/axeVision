import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Snapshot } from "../models";
import { sendError, sendSuccess } from "../types/response";
import { redisClient } from "../utils/redis";
import { SnapshotService } from "../services/snapshotService";

export class SnapshotController {

  //to create a snapshot - used in extension
  static async createSnapshot(req: AuthRequest, res: Response) {
    try {
      const { content, structuredContent, capturedAt, title, url, metadata } =
        req.body;
      const websiteId = req.params.websiteId;
      const userId = req.userId;

      if (!websiteId || !content) {
        return sendError(
          res,
          400,
          "Missing required fields",
          "VALIDATION_ERROR"
        );
      }

      console.log("=== BACKEND SNAPSHOT DEBUG ===");
      console.log("Received metadata:", JSON.stringify(metadata, null, 2));
      console.log("Received structuredContent:", !!structuredContent);
      console.log("================================");

      // Prepare snapshot data using the service (handles compression and metadata formatting)
      const snapshotData = await SnapshotService.prepareSnapshotData({
        content,
        structuredContent,
        capturedAt,
        title,
        url,
        metadata,
        websiteId,
        userId: userId!,
      });

      console.log("=== METADATA COMPRESSION ===");
      console.log(`Original metadata size: ${snapshotData.metadataSize} bytes`);
      console.log(
        `Compressed metadata size: ${snapshotData.metadataCompressedSize} bytes`
      );
      console.log(
        `Compression ratio: ${((1 - snapshotData.metadataCompressedSize / snapshotData.metadataSize) * 100).toFixed(1)}%`
      );
      console.log("============================");

      // create snapshot using the prepared data
      const snapshot = await Snapshot.create(snapshotData);

      console.log("=== SNAPSHOT CREATED ===");
      console.log("Snapshot ID:", snapshot.id);
      console.log("Metadata compressed and saved successfully");
      console.log("=========================");

      return sendSuccess(
        res,
        {
          id: snapshot._id.toString(),
          capturedAt: snapshot.capturedAt.toISOString(),
          contentLength: content.length,
          structuredElementCount:
            (structuredContent?.headings?.length || 0) +
            (structuredContent?.paragraphs?.length || 0) +
            (structuredContent?.links?.length || 0) +
            (structuredContent?.inputs?.length || 0) +
            (structuredContent?.buttons?.length || 0),
          debug: {
            metadataReceived: !!metadata,
            performanceReceived: !!metadata?.performance,
            elementCountsCalculated: {
              headings: structuredContent?.headings?.length || 0,
              paragraphs: structuredContent?.paragraphs?.length || 0,
              links: structuredContent?.links?.length || 0,
              inputs: structuredContent?.inputs?.length || 0,
              buttons: structuredContent?.buttons?.length || 0,
              forms: structuredContent?.forms?.length || 0,
            },
          },
        },
        "Snapshot created",
        undefined,
        201
      );
      // all structured info is stored compressed in metadataCompressed.
    } catch (error: any) {
      console.error("Snapshot creation error:", error);
      return sendError(res, 500, "Failed to create snapshot", "SERVER_ERROR");
    }
  }

  //fetches all saved snapshots for a specific website, decompresses them, and returns the data.
  static async getSnapshots(req: AuthRequest, res: Response) {
    try {
      if (!req.params.websiteId) {
        return sendError(
          res,
          400,
          "Website ID is required",
          "VALIDATION_ERROR"
        );
      }

      //check cache first
      const cacheKey = `snapshots:${req.userId}:${req.params.websiteId}`;
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        console.log("Cache HIT for snapshots");
        const parsed = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
        return sendSuccess(
          res,
          parsed,
          "Snapshots retrieved from cache"
        );
      }

      console.log("Cache MISS for snapshots");

      const snapshots = await Snapshot.find(
        {
          websiteId: req.params.websiteId,
          userId: req.userId!,
        },
        {
          _id: 1,
          capturedAt: 1,
          contentCompressed: 1,
          contentEncoding: 1,
          contentPreview: 1,
          title: 1,
          url: 1,
          //only compressed metadata fields
          metadataCompressed: 1,
          metadataEncoding: 1,
        }
      )
        .sort({ capturedAt: -1 })
        .limit(50);

      console.log("=== GET SNAPSHOTS DEBUG ===");
      console.log(`Found ${snapshots.length} snapshots`);
      console.log("============================");

      //decompress content and metadata transparently for API response
      const results = await Promise.all(
        snapshots.map(async (snapshot) => {
          let metadata: any = null;
          let contentOut = "";

          //decompress metadata if it's compressed
          if (
            snapshot.metadataCompressed &&
            snapshot.metadataEncoding === "gzip"
          ) {
            try {
              metadata = await SnapshotService.decompressMetadata(
                Buffer.from(snapshot.metadataCompressed as any)
              );
            } catch (e) {
              console.error(
                "Failed to decompress snapshot metadata",
                snapshot.id,
                e
              );
              //no fallback needed, metadata will be null
              metadata = null;
            }
          }

          // Decompress content
          if (
            snapshot.contentCompressed &&
            snapshot.contentEncoding === "gzip"
          ) {
            try {
              contentOut = await SnapshotService.decompressContent(
                Buffer.from(snapshot.contentCompressed as any)
              );
            } catch (e) {
              console.error(
                "Failed to decompress snapshot content",
                snapshot.id,
                e
              );
            }
          }

          return {
            id: snapshot._id.toString(),
            capturedAt: snapshot.capturedAt.toISOString(),
            content: contentOut,
            contentPreview: snapshot.contentPreview,
            title: snapshot.title,
            url: snapshot.url,
            performance: metadata?.performance || null,
            elementCounts: metadata?.elementCounts || null,
            structuredContent: metadata?.structuredContent || null,
            metadata: metadata,
          };
        })
      );

      //cache the results for 10 minutes
      await redisClient.setex(cacheKey, 600, JSON.stringify(results));

      return sendSuccess(res, results);
    } catch (error: any) {
      console.error("Get snapshots error:", error);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  }
}
