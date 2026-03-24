import { useMutation } from "@tanstack/react-query";
import { accessibilityService, chatService } from "../services/api";
import type { AccessibilityIssue } from "@axeVision/shared";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

interface ChatRequest {
  query: string;
  snapshotId: string;
  websiteId: string;
  conversationHistory: ChatMessage[];
}

interface ChatResponse {
  response: string;
  timestamp: string;
}

export const useGenerateAIRecommendationsMutation = (websiteId: string) => {
  return useMutation<string, Error, AccessibilityIssue[]>({
    mutationFn: async (issues: AccessibilityIssue[]) => {
      if (!websiteId) throw new Error("Invalid website ID for AI recommendations.");
      const data = await accessibilityService.generateAccessibilityRecommendations(websiteId, { issues });
      if (typeof data === "string") return data as string;
      return (data?.recommendations as string) ?? "";
    },
  });
};

export const useAccessibilityChatbotMutation = () => {
  return useMutation<ChatResponse, Error, ChatRequest>({
    mutationFn: async (chatData: ChatRequest) => {
      const data = await chatService.processChat(chatData);
      return data as ChatResponse;
    },
  });
};
