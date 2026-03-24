import type { Response } from "express";
import type { AuthRequest } from "../middleware/authMiddleware";
import { v4 as uuidv4 } from "uuid";
import { generateToken } from "../utils/jwt";
import { User, Member, MemberType } from "../models";
import { sendError, sendSuccess } from "../types/response";
import type { MemberDTO } from "@axeVision/shared";
import {
  createMemberValidation,
  updateMemberValidation,
} from "../validations/memberValidation";

export class MembersController {
  //create first member
  static createInitialMember = async (req: AuthRequest, res: Response) => {
    try {
      const userId = req.userId;
      if (!userId)
        return sendError(res, 401, "User not authenticated", "UNAUTHORIZED");

      // Validate input
      const validatedData = createMemberValidation.parse(req.body);
      const { name, role, type } = validatedData;

      const existingMember = await Member.findOne({ userId });
      if (existingMember)
        return sendError(
          res,
          409,
          "User already has a member profile. Onboarding complete.",
          "ALREADY_ONBOARDED"
        );

      const member = await Member.create({
        userId,
        memberId: uuidv4(),
        name: name,
        role: role,
        type,
      });

      await User.findByIdAndUpdate(userId, { onboarded: true });

      const token = generateToken({
        userId,
        memberId: member.memberId,
        memberType: member.type,
      });

      const data = {
        member: {
          memberId: member.memberId,
          name: member.name,
          role: member.role,
          type: member.type,
          createdAt: member.createdAt.toISOString(),
        } as MemberDTO,
        token,
        onboarded: true,
      };
      return sendSuccess(
        res,
        data,
        "Member profile created successfully. Onboarding complete.",
        undefined,
        201
      );
    } catch (err: any) {
      if (err.name === "ZodError") {
        const errorMessages = err.errors.map((e: any) => e.message).join(", ");
        return sendError(res, 400, errorMessages, "VALIDATION_ERROR");
      }
      console.error("Create initial member error:", err);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  };

  //creating member in the "manage" page
  static createMember = async (req: AuthRequest, res: Response) => {
    try {
      if (req.memberType !== "Admin")
        return sendError(
          res,
          403,
          "Only Admins can add new members.",
          "FORBIDDEN"
        );

      const validatedData = createMemberValidation.parse(req.body);
      const { name, role, type, targetUserId } = validatedData;

      const userId = targetUserId || req.userId;
      if (!userId) {
        return sendError(res, 401, "User not authenticated", "UNAUTHORIZED");
      }
      const member = await Member.create({
        userId,
        memberId: uuidv4(),
        name,
        role,
        type,
      });

      const data = {
        member: {
          memberId: member.memberId,
          name: member.name,
          role: member.role,
          type: member.type,
          createdAt: member.createdAt.toISOString(),
        } as MemberDTO,
      };
      return sendSuccess(
        res,
        data,
        "Member profile created successfully",
        undefined,
        201
      );
    } catch (err: any) {
      if (err.name === "ZodError") {
        const errorMessages = err.errors.map((e: any) => e.message).join(", ");
        return sendError(res, 400, errorMessages, "VALIDATION_ERROR");
      }
      console.error("Create member error:", err);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  };

  //get all members
  static getMembersByUser = async (req: AuthRequest, res: Response) => {
    try {
      const members = await Member.find(
        { userId: req.userId },
        {
          memberId: 1,
          name: 1,
          role: 1,
          type: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      ).sort({ createdAt: -1 });
      const data = {
        members: members.map((m) => ({
          memberId: m.memberId,
          name: m.name,
          role: m.role,
          type: m.type as MemberType,
          createdAt: m.createdAt.toISOString(),
          updatedAt: m.updatedAt.toISOString(),
        })) as MemberDTO[],
        count: members.length,
      };
      return sendSuccess(res, data);
    } catch (err: any) {
      console.error("Get members error:", err);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  };

  //get by id
  static getMemberById = async (req: AuthRequest, res: Response) => {
    try {
      const { memberId } = req.params;
      const member = await Member.findOne(
        { userId: req.userId, memberId },
        {
          memberId: 1,
          name: 1,
          role: 1,
          type: 1,
          createdAt: 1,
          updatedAt: 1,
        }
      );

      if (!member)
        return sendError(
          res,
          404,
          "Member not found or not authorized",
          "NOT_FOUND"
        );
      if (req.memberType !== "Admin" && member.memberId !== req.memberId)
        return sendError(
          res,
          403,
          "You can only view your own member profile.",
          "FORBIDDEN"
        );

      const data = {
        member: {
          memberId: member.memberId,
          name: member.name,
          role: member.role,
          type: member.type as MemberType,
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
        } as MemberDTO,
      };
      return sendSuccess(res, data);
    } catch (err: any) {
      console.error("Get member error:", err);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  };

  //update member
  static updateMember = async (req: AuthRequest, res: Response) => {
    try {
      const { memberId } = req.params;
      const validatedData = updateMemberValidation.parse(req.body);
      const { name, role, type } = validatedData;

      if (req.memberType !== "Admin" && memberId !== req.memberId)
        return sendError(
          res,
          403,
          "You can only update your own member profile.",
          "FORBIDDEN"
        );

      if (req.memberType !== "Admin" && type && type !== req.memberType)
        return sendError(
          res,
          403,
          "You cannot change your member type.",
          "FORBIDDEN"
        );

      const updateFields: {
        name?: string;
        role?: string;
        type?: MemberType;
        updatedAt: Date;
      } = {
        updatedAt: new Date(),
      };

      if (name) updateFields.name = name;
      if (role) updateFields.role = role;
      if (req.memberType === "Admin" && type)
        updateFields.type = type as MemberType;

      const member = await Member.findOneAndUpdate({ memberId }, updateFields, {
        new: true,
        select: {
          memberId: 1,
          name: 1,
          role: 1,
          type: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      });

      if (!member) {
        return sendError(res, 404, "Member not found", "NOT_FOUND");
      }

      const data = {
        member: {
          memberId: member.memberId,
          name: member.name,
          role: member.role,
          type: member.type as MemberType,
          createdAt: member.createdAt.toISOString(),
          updatedAt: member.updatedAt.toISOString(),
        } as MemberDTO,
      };
      return sendSuccess(res, data, "Member profile updated successfully");
    } catch (err: any) {
      if (err.name === "ZodError") {
        const errorMessages = err.errors.map((e: any) => e.message).join(", ");
        return sendError(res, 400, errorMessages, "VALIDATION_ERROR");
      }
      console.error("Update member error:", err);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  };

  //delete member
  static deleteMember = async (req: AuthRequest, res: Response) => {
    try {
      if (req.memberType !== "Admin")
        return sendError(
          res,
          403,
          "Only Admins can delete members.",
          "FORBIDDEN"
        );

      const { memberId } = req.params;
      const adminMembers = await Member.find({
        userId: req.userId,
        type: "Admin",
      });

      if (adminMembers.length === 1 && adminMembers[0]?.memberId === memberId)
        return sendError(
          res,
          400,
          "Cannot delete the last Admin profile.",
          "VALIDATION_ERROR"
        );

      await Member.findOneAndDelete({ memberId });
      return sendSuccess(
        res,
        { deleted: true },
        "Member profile deleted successfully"
      );
    } catch (err: any) {
      console.error("Delete member error:", err);
      return sendError(res, 500, "Server error", "SERVER_ERROR");
    }
  };
}
