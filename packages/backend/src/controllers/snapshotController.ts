import { Response } from "express";
import { AuthRequest } from "../middleware/authMiddleware";
import { Snapshot } from "../models";
import { sendError, sendSuccess } from "../types/response";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";
import { redisClient } from "../utils/redis";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

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

      //counting elements directly from the request body
      let elementCount = 0;
      if (structuredContent) {
        elementCount =
          (structuredContent.headings?.length || 0) +
          (structuredContent.paragraphs?.length || 0) +
          (structuredContent.links?.length || 0) +
          (structuredContent.inputs?.length || 0) +
          (structuredContent.buttons?.length || 0);
      }

      //formatting the complete metadata object properly
      const completeMetadata = {
        ...(metadata || {}),
        structuredContent: structuredContent || null,
        elementCounts: {
          headings: structuredContent?.headings?.length || 0,
          paragraphs: structuredContent?.paragraphs?.length || 0,
          links: structuredContent?.links?.length || 0,
          inputs: structuredContent?.inputs?.length || 0,
          buttons: structuredContent?.buttons?.length || 0,
          forms: structuredContent?.forms?.length || 0,
        },
        performance: metadata?.performance || null,
      };

      //compress metadata for storage
      const metadataString = JSON.stringify(completeMetadata);
      const metadataBuffer = Buffer.from(metadataString, "utf8");
      const compressedMetadata = await gzipAsync(metadataBuffer);

      console.log("=== METADATA COMPRESSION ===");
      console.log(`Original metadata size: ${metadataBuffer.length} bytes`);
      console.log(
        `Compressed metadata size: ${compressedMetadata.length} bytes`
      );
      console.log(
        `Compression ratio: ${((1 - compressedMetadata.length / metadataBuffer.length) * 100).toFixed(1)}%`
      );
      console.log("============================");

      //compress content for storage
      const originalBuffer = Buffer.from(content, "utf8");
      const compressedBuffer = await gzipAsync(originalBuffer);
      const originalSize = originalBuffer.length;
      const compressedSize = compressedBuffer.length;

      //create snapshot and store compressed content and metadata
      const snapshot = await Snapshot.create({
        websiteId,
        userId: userId!,
        capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
        contentPreview: content.substring(0, 500),
        title: title?.substring(0, 255),
        url: url?.substring(0, 255),
        //store compressed metadata only
        metadataCompressed: compressedMetadata,
        metadataEncoding: "gzip",
        metadataSize: metadataBuffer.length,
        metadataCompressedSize: compressedMetadata.length,
        contentCompressed: compressedBuffer,
        contentEncoding: "gzip",
        contentSize: originalSize,
        contentCompressedSize: compressedSize,
      });

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
          structuredElementCount: elementCount,
          debug: {
            metadataReceived: !!metadata,
            performanceReceived: !!metadata?.performance,
            elementCountsCalculated: completeMetadata.elementCounts,
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
        return sendSuccess(
          res,
          JSON.parse(cachedData),
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
              const decompressedMetadata = await gunzipAsync(
                Buffer.from(snapshot.metadataCompressed as any)
              );
              metadata = JSON.parse(decompressedMetadata.toString("utf8"));
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
              const decompressed = await gunzipAsync(
                Buffer.from(snapshot.contentCompressed as any)
              );
              contentOut = decompressed.toString("utf8");
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
      await redisClient.setEx(cacheKey, 600, JSON.stringify(results));

      return sendSuccess(res, results);
    } catch (error: any) {
      console.error("Get snapshots error:", error);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  }
}
