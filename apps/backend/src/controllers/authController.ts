import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { MemberType } from "../utils/response";
import { prisma } from "../utils/prisma";
import { sendError, sendSuccess } from "../utils/response";
import type {
  LoginMultipleMembersDTO,
  LoginSingleMemberDTO,
  RegisterDTO,
  SelectMemberDTO,
  MemberDTO,
} from "@axeVision/shared";
import {
  loginValidation,
  registerValidation,
  selectMemberValidation,
} from "../validations/authValidation";

export class AuthController {
  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerValidation.parse(req.body);
      const { email, password } = validatedData;

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser)
        return sendError(res, 409, "Email already exists", "EMAIL_EXISTS");

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          onboarded: false,
        },
      });

      const token = generateToken({ userId: user.id });
      const data: RegisterDTO = {
        userId: user.id,
        onboarded: user.onboarded,
        token,
      };
      return sendSuccess(
        res,
        data,
        "User registered successfully. Please complete onboarding.",
        undefined,
        201
      );
    } catch (error: any) {
      if (error.name === "ZodError") {
        const errorMessages = error.errors
          .map((err: any) => err.message)
          .join(", ");
        return sendError(res, 400, errorMessages, "VALIDATION_ERROR");
      }
      console.error("Register error:", error);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validatedData = loginValidation.parse(req.body);
      const { email, password } = validatedData;

      const user = await prisma.user.findUnique({ where: { email } });

      if (!user) {
        // Log whenever not production; `pnpm dev` often leaves NODE_ENV unset, so `=== "development"` never ran.
        if (process.env.NODE_ENV !== "production") {
          const total = await prisma.user.count();
          console.warn(
            `[auth/login] No user "${email}". Users in this DB: ${total}. If total is 0, wrong database name in DATABASE_URL (path after .net/) — fix in Atlas → Browse Collections.`
          );
        }
        return sendError(
          res,
          401,
          "Invalid email or password",
          "INVALID_CREDENTIALS"
        );
      }

      if (!(await bcrypt.compare(password, user.password))) {
        if (process.env.NODE_ENV !== "production") {
          console.warn(`[auth/login] Wrong password for "${email}".`);
        }
        return sendError(
          res,
          401,
          "Invalid email or password",
          "INVALID_CREDENTIALS"
        );
      }

      //not onboarded yet
      if (!user.onboarded) {
        const token = generateToken({ userId: user.id });
        const data: RegisterDTO = {
          userId: user.id,
          onboarded: user.onboarded,
          token,
        };
        return sendSuccess(res, data, "Please complete your onboarding.");
      }

      const members = await prisma.member.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
      });

      if (members.length === 0)
        return sendError(
          res,
          500,
          "No member profiles found for this user, despite being onboarded.",
          "MEMBER_NOT_FOUND"
        );

      //if single member then auto login
      if (members.length === 1) {
        const primaryMember = members[0]!;
        const token = generateToken({
          userId: user.id,
          memberId: primaryMember.memberId,
          memberType: primaryMember.type as MemberType,
        });
        const data: LoginSingleMemberDTO = {
          token,
          userId: user.id,
          memberId: primaryMember.memberId,
          memberType: primaryMember.type as MemberType,
          onboarded: user.onboarded,
        };
        return sendSuccess(res, data, "Login successful");
      }

      //if multiple members then return list
      const data: LoginMultipleMembersDTO = {
        userId: user.id,
        onboarded: user.onboarded,
        members: members.map(
          (m): MemberDTO => ({
            memberId: m.memberId,
            name: m.name,
            role: m.role,
            type: m.type as MemberType,
            createdAt: m.createdAt.toISOString(),
            updatedAt: m.updatedAt.toISOString(),
          })
        ),
      };
      return sendSuccess(
        res,
        data,
        "Multiple member profiles found. Please select one."
      );
    } catch (error: any) {
      if (error.name === "ZodError") {
        const errorMessages = error.errors
          .map((err: any) => err.message)
          .join(", ");
        return sendError(res, 400, errorMessages, "VALIDATION_ERROR");
      }
      console.error("Login error:", error);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  }

  //token is generated based on the member seleted not based on teams login
  static async selectMemberAndGenerateToken(req: Request, res: Response) {
    try {
      const { userId, memberId } = selectMemberValidation.parse(req.body);

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user)
        return sendError(res, 404, "User not found.", "USER_NOT_FOUND");

      const selectedMember = await prisma.member.findFirst({
        where: {
          userId: user.id,
          memberId,
        },
      });
      if (!selectedMember)
        return sendError(
          res,
          404,
          "Member profile not found for this user.",
          "MEMBER_NOT_FOUND"
        );

      const token = generateToken({
        userId: user.id,
        memberId: selectedMember.memberId,
        memberType: selectedMember.type as MemberType,
      });

      const data: SelectMemberDTO = {
        token,
        userId: user.id,
        memberId: selectedMember.memberId,
        memberType: selectedMember.type as MemberType,
        onboarded: user.onboarded,
      };
      return sendSuccess(res, data, "Member profile selected successfully.");
    } catch (error: any) {
      if (error.name === "ZodError") {
        const errorMessages = error.errors
          .map((err: any) => err.message)
          .join(", ");
        return sendError(res, 400, errorMessages, "VALIDATION_ERROR");
      }
      console.error("Select member and generate token error:", error);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  }
}
