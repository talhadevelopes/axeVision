import { Router } from "express";
import { authenticate } from "../middleware/authMiddleware";
import { validateWebsiteExists } from "../validations/websiteValidation";
import { SnapshotController } from "../controllers/snapshotController";

const router: Router = Router();

// POST /api/websites/:websiteId/snapshots - Create a new snapshot
router.post(
  "/:websiteId/snapshots",
  authenticate,
  validateWebsiteExists,
  SnapshotController.createSnapshot
);

// GET /api/websites/:websiteId/snapshots - Get all snapshots for a website
router.get(
  "/:websiteId/snapshots",
  authenticate,
  validateWebsiteExists,
  SnapshotController.getSnapshots
);

export default router;