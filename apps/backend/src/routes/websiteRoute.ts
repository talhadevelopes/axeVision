import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { WebsiteController } from "../controllers/websiteController";

const router: Router = Router();

// POST /api/websites - Create a new website
router.post("/", authenticate, WebsiteController.createWebsite);

// GET /api/websites - Get all user websites
router.get("/", authenticate, WebsiteController.getWebsites);

export default router;