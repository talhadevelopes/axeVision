import { Snapshot } from "../models";
import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

export class SnapshotService {
  /**
   * Internal logic for preparing snapshot data, including compression of content and metadata.
   */
  static async prepareSnapshotData(params: {
    content: string;
    structuredContent?: any;
    metadata?: any;
    capturedAt?: string;
    title?: string;
    url?: string;
    websiteId: string;
    userId: string;
  }) {
    const { content, structuredContent, capturedAt, title, url, metadata, websiteId, userId } = params;

    // formatting the complete metadata object properly
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

    // compress metadata for storage
    const metadataString = JSON.stringify(completeMetadata);
    const metadataBuffer = Buffer.from(metadataString, "utf8");
    const compressedMetadata = await gzipAsync(metadataBuffer);

    // compress content for storage
    const originalBuffer = Buffer.from(content, "utf8");
    const compressedBuffer = await gzipAsync(originalBuffer);
    const originalSize = originalBuffer.length;
    const compressedSize = compressedBuffer.length;

    return {
      websiteId,
      userId,
      capturedAt: capturedAt ? new Date(capturedAt) : new Date(),
      contentPreview: content.substring(0, 500),
      title: title?.substring(0, 255),
      url: url?.substring(0, 255),
      metadataCompressed: compressedMetadata,
      metadataEncoding: "gzip",
      metadataSize: metadataBuffer.length,
      metadataCompressedSize: compressedMetadata.length,
      contentCompressed: compressedBuffer,
      contentEncoding: "gzip",
      contentSize: originalSize,
      contentCompressedSize: compressedSize,
      originalMetadataSize: metadataBuffer.length, // for logging
      compressedMetadataSize: compressedMetadata.length // for logging
    };
  }

  /**
   * Decompress snapshot content
   */
  static async decompressContent(compressedBuffer: Buffer): Promise<string> {
    const decompressed = await gunzipAsync(compressedBuffer);
    return decompressed.toString("utf8");
  }

  /**
   * Decompress snapshot metadata
   */
  static async decompressMetadata(compressedBuffer: Buffer): Promise<any> {
    const decompressed = await gunzipAsync(compressedBuffer);
    return JSON.parse(decompressed.toString("utf8"));
  }
}
