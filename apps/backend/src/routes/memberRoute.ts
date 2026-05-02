import express, { Router } from "express"
import { MembersController } from "../controllers/memberController"
import { authenticate, authorizeRoles } from "../middleware/authMiddleware"
import { MemberType } from "../models"

const router: Router = Router()

router.post("/onboard", authenticate, MembersController.createInitialMember)
router.use(authenticate)

// Get all members for the authenticated user (Admin can see all, Member only their own)
router.get("/", MembersController.getMembersByUser)
router.post("/", authorizeRoles(MemberType.Admin), MembersController.createMember)
router.put("/:memberId", MembersController.updateMember)
router.delete("/:memberId", authorizeRoles(MemberType.Admin), MembersController.deleteMember)

export default router
