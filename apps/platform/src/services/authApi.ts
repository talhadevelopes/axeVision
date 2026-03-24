import axios from "axios";
import { API_BASE_URL, setupInterceptors } from "./api";
import type { LoginResponse, OnboardResponse, RegisterResponse, SelectMemberResponse } from "@axeVision/shared";

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    setupInterceptors();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.response?.status === 401) {
        throw new Error("Invalid email or password");
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Login failed. Please try again.");
      }
    }
  },

  register: async (
    email: string,
    password: string
  ): Promise<RegisterResponse> => {
    setupInterceptors();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        email,
        password,
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Registration failed. Please try again.");
      }
    }
  },

  selectMemberProfile: async (
    userId: string,
    memberId: string
  ): Promise<SelectMemberResponse> => {
    setupInterceptors();
    try {
      const response = await axios.post(
        `${API_BASE_URL}/api/auth/select-member`,
        {
          userId,
          memberId,
        }
      );
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Failed to select member profile. Please try again.");
      }
    }
  },

  onboard: async (
    name: string,
    role: string,
    type: "Admin" | "Member"
  ): Promise<OnboardResponse> => {
    setupInterceptors();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/members/onboard`, {
        name,
        role,
        type,
      });
      return response.data.data;
    } catch (error: any) {
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      } else if (error.message) {
        throw new Error(error.message);
      } else {
        throw new Error("Onboarding failed. Please try again.");
        }
      }
    },
  };