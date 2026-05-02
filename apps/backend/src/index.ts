import "dotenv/config";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { sendError, sendSuccess } from "./utils/response";
import { redisClient, connectRedis } from "./utils/redis";
import hpp from "hpp";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import { createServer } from "http";
import { Server } from "socket.io";
import { initChatSockets } from "./utils/chat";
import { prisma } from "./utils/prisma";

export const startServer = async () => {
  try {
    await prisma.$connect();
    console.log("Connected to the database")
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
        await prisma.user.findFirst({ take: 1 });

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

    // Base website routes
    app.use("/api/websites", routes.websites);
    
    // Website sub-resource routes
    app.use("/api/websites", routes.snapshots);
    app.use("/api/websites", routes.accessibility);
    
    // Specialized standalone routes
    app.use("/api/accessibility", routes.accessibility);
    app.use("/api/members", routes.members);
    app.use("/api/chat", routes.chatbot);
    app.use("/api/messages", routes.messages);
    app.use("/api/auth", routes.auth);

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
    initChatSockets(io);

    const server = httpServer.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });

    const gracefulShutdown = async (signal: string) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log("Server closed");

        try {
          await prisma.$disconnect();
          console.log("Database disconnected");
          console.log("Redis ready to exit");

          process.exit(0);
        } catch (error) {
          console.error("Error during shutdown:", error);
          process.exit(1);
        }
      });
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
