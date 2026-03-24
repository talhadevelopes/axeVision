import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { generateToken } from "../utils/jwt";
import { User, Member, MemberType } from "../models";
import { sendError, sendSuccess } from "../types/response";
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

      const existingUser = await User.findOne({ email });
      if (existingUser)
        return sendError(res, 409, "Email already exists", "EMAIL_EXISTS");

      const hashedPassword = await bcrypt.hash(password, 10);
      const user = await User.create({
        email,
        password: hashedPassword,
        onboarded: false,
        createdAt: new Date(),
      });

      const token = generateToken({ userId: user._id.toString() });
      const data: RegisterDTO = {
        userId: user._id.toString(),
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

      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password)))
        return sendError(
          res,
          401,
          "Invalid email or password",
          "INVALID_CREDENTIALS"
        );

      //not onboarded yet
      if (!user.onboarded) {
        const token = generateToken({ userId: user._id.toString() });
        const data: RegisterDTO = {
          userId: user._id.toString(),
          onboarded: user.onboarded,
          token,
        };
        return sendSuccess(res, data, "Please complete your onboarding.");
      }

      const members = await Member.find({ userId: user._id.toString() })
        .sort({ createdAt: 1 });

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
          userId: user._id.toString(),
          memberId: primaryMember.memberId,
          memberType: primaryMember.type as MemberType,
        });
        const data: LoginSingleMemberDTO = {
          token,
          userId: user._id.toString(),
          memberId: primaryMember.memberId,
          memberType: primaryMember.type as MemberType,
          onboarded: user.onboarded,
        };
        return sendSuccess(res, data, "Login successful");
      }

      //if multiple members then return list
      const data: LoginMultipleMembersDTO = {
        userId: user._id.toString(),
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

      const user = await User.findById(userId);
      if (!user)
        return sendError(res, 404, "User not found.", "USER_NOT_FOUND");

      const selectedMember = await Member.findOne({
        userId: user._id.toString(),
        memberId
      });
      if (!selectedMember)
        return sendError(
          res,
          404,
          "Member profile not found for this user.",
          "MEMBER_NOT_FOUND"
        );

      const token = generateToken({
        userId: user._id.toString(),
        memberId: selectedMember.memberId,
        memberType: selectedMember.type as MemberType,
      });

      const data: SelectMemberDTO = {
        token,
        userId: user._id.toString(),
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