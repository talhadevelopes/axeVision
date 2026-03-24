import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { AuthController } from "../controllers/authController";
import { User, Member } from "../models";
import { generateToken } from "../utils/jwt";

// Mock external dependencies
jest.mock("../models");
jest.mock("bcryptjs");
jest.mock("../utils/jwt");

describe("AuthController", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    req = { body: {} };
    res = { status: statusMock };
    jest.clearAllMocks();
  });

  afterAll(() => {
    jest.restoreAllMocks();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      // Arrange
      req.body = { email: "test@example.com", password: "Password123!" };
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        password: "hashedPassword",
        onboarded: false,
      };

      (User.findOne as jest.Mock).mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashedPassword");
      (User.create as jest.Mock).mockResolvedValue(mockUser);
      (generateToken as jest.Mock).mockReturnValue("token123");

      // Act
      await AuthController.register(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(201);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          userId: "user123",
          onboarded: false,
          token: "token123",
        },
        message: "User registered successfully. Please complete onboarding.",
      });
    });

    it("should return 409 if email already exists", async () => {
      // Arrange
      req.body = { email: "existing@example.com", password: "Password123!" };
      (User.findOne as jest.Mock).mockResolvedValue({ email: "existing@example.com" });

      // Act
      await AuthController.register(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(409);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Email already exists",
        code: "EMAIL_EXISTS",
      });
    });
  });

  describe("login", () => {
    it("should login with single member successfully", async () => {
      // Arrange
      req.body = { email: "test@example.com", password: "Password123!" };
      const mockUser = {
        _id: "user123",
        email: "test@example.com",
        password: "hashedPassword",
        onboarded: true,
      };
      const mockMember = {
        memberId: "member123",
        userId: "user123",
        type: "INDIVIDUAL",
        name: "John Doe",
        role: "Admin",
      };

      (User.findOne as jest.Mock).mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (Member.find as jest.Mock).mockReturnValue({
        sort: jest.fn().mockResolvedValue([mockMember]),
      });
      (generateToken as jest.Mock).mockReturnValue("token123");

      // Act
      await AuthController.login(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          token: "token123",
          userId: "user123",
          memberId: "member123",
          memberType: "INDIVIDUAL",
          onboarded: true,
        },
        message: "Login successful",
      });
    });

    it("should return 401 for invalid credentials", async () => {
      // Arrange
      req.body = { email: "test@example.com", password: "WrongPassword!" };
      (User.findOne as jest.Mock).mockResolvedValue(null);

      // Act
      await AuthController.login(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "Invalid email or password",
        code: "INVALID_CREDENTIALS",
      });
    });
  });

  describe("selectMemberAndGenerateToken", () => {
    it("should select member and generate token successfully", async () => {
      // Arrange
      req.body = { userId: "user123", memberId: "member123" };
      const mockUser = { _id: "user123", onboarded: true };
      const mockMember = {
        memberId: "member123",
        userId: "user123",
        type: "INDIVIDUAL",
      };

      (User.findById as jest.Mock).mockResolvedValue(mockUser);
      (Member.findOne as jest.Mock).mockResolvedValue(mockMember);
      (generateToken as jest.Mock).mockReturnValue("token123");

      // Act
      await AuthController.selectMemberAndGenerateToken(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith({
        success: true,
        data: {
          token: "token123",
          userId: "user123",
          memberId: "member123",
          memberType: "INDIVIDUAL",
          onboarded: true,
        },
        message: "Member profile selected successfully.",
      });
    });

    it("should return 404 if user not found", async () => {
      // Arrange
      req.body = { userId: "nonexistent", memberId: "member123" };
      (User.findById as jest.Mock).mockResolvedValue(null);

      // Act
      await AuthController.selectMemberAndGenerateToken(req as Request, res as Response);

      // Assert
      expect(statusMock).toHaveBeenCalledWith(404);
      expect(jsonMock).toHaveBeenCalledWith({
        success: false,
        message: "User not found.",
        code: "USER_NOT_FOUND",
      });
    });
  });
});