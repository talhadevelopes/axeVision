import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import mongoose from "mongoose";
import routes from "./routes";
import { connectDatabase } from "./utils/database";
import { sendError, sendSuccess } from "./types/response";
import { redisClient, connectRedis } from "./utils/redis"; // Import from redis.ts
import hpp from "hpp";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { createServer } from "http";
import { Server } from "socket.io";
import { initChatSockets } from "./sockets/chat";

dotenv.config();

export const startServer = async () => {
  try {
    await connectDatabase();

    await connectRedis();
    console.log("Connected to Redis");

    const app = express();
    const PORT = 4000;

    app.use(express.json({ limit: "50mb" }));
    app.use(helmet());
    app.use(hpp());
    app.use(mongoSanitize());
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:5173",
      /^chrome-extension:\/\/[a-z]+$/,
    ];
    app.use(
      cors({
        origin: allowedOrigins,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
        credentials: true,
      })
    );

    app.get("/api/health", async (req, res) => {
      try {
        if (mongoose.connection.readyState !== 1) {
          throw new Error("Database not connected");
        }
        await redisClient.ping();

        return sendSuccess(
          res,
          {
            database: "connected",
            timestamp: new Date().toISOString(),
          },
          "ok"
        );
      } catch (error) {
        console.error("Health check failed:", error);
        return sendError(res, 500, "error", "HEALTH_ERROR", {
          database: "disconnected",
          timestamp: new Date().toISOString(),
        });
      }
    });

    app.use("/api/auth", routes.auth);
    app.use("/api/websites", routes.websites);
    app.use("/api/websites", routes.snapshots);
    app.use("/api/websites", routes.accessibility);
    app.use("/api/accessibility", routes.accessibility);
    app.use("/api/members", routes.members);
    app.use("/api/chat", routes.chatbot);
    app.use("/api/messages", routes.messages);

    app.use("*", (req, res) => {
      return sendError(res, 404, "Route not found", "NOT_FOUND", {
        path: req.originalUrl,
      });
    });

    app.use(
      (
        error: any,
        req: express.Request,
        res: express.Response,
        next: express.NextFunction
      ) => {
        console.error("Server error:", error);
        return sendError(
          res,
          500,
          process.env.NODE_ENV === "development"
            ? error?.message || "Internal server error"
            : "Something went wrong",
          "SERVER_ERROR"
        );
      }
    );

    const httpServer = createServer(app);
    const io = new Server(httpServer, {
      cors: {
        origin: allowedOrigins,
        methods: ["GET", "POST"],
        credentials: true,
      },
    });
    initChatSockets(io, redisClient);

    const server = httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("Server closed");

        try {
          await mongoose.disconnect();
          console.log("Database disconnected");

          // Disconnect Redis
          if (redisClient.isOpen) {
            await redisClient.disconnect();
            console.log("Redis disconnected");
          }

          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds if graceful shutdown hangs
      setTimeout(() => {
        console.error("Forcing shutdown after timeout");
        process.exit(1);
      }, 10000);
    };

    process.on("SIGINT", () => gracefulShutdown("SIGINT"));
    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

if (require.main === module) {
  startServer();
}