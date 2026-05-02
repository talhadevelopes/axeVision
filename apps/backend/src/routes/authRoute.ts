import express, { Router } from "express"
import { AuthController } from "../controllers/authController"

const router: Router = Router()

router.post("/register", AuthController.register)
router.post("/login", AuthController.login)
router.post("/select-member", AuthController.selectMemberAndGenerateToken)

export default router
