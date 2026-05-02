import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
export const API_BASE_URL = import.meta.env.VITE_PUBLIC_BACKEND_URL || "http://localhost:4000";

let isInterceptorSetup = false;
export const setupInterceptors = () => {
  if (isInterceptorSetup) return;

  axios.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  axios.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth();
        if (
          typeof window !== "undefined" &&
          window.location.pathname !== "/login"
        ) {
          window.location.href = "/login";
        }
      }
      return Promise.reject(error);
    }
  );

  isInterceptorSetup = true;
};


// Website Service
export const websiteService = {
  createWebsite: async (websiteData: any) => {
    setupInterceptors();
    const response = await axios.post(`${API_BASE_URL}/api/websites`, websiteData);
    return response.data.data;
  },

  getWebsites: async () => {
    setupInterceptors();
    const response = await axios.get(`${API_BASE_URL}/api/websites`);
    return response.data.data;
  }
};

// Accessibility Service
export const accessibilityService = {
  saveAccessibilityResults: async (websiteId: string | number, accessibilityData: any) => {
    setupInterceptors();
    const response = await axios.post(`${API_BASE_URL}/api/websites/${websiteId}/accessibility`, accessibilityData);
    return response.data.data;
  },

  getAccessibilityResults: async (websiteId: string | number) => {
    setupInterceptors();
    const response = await axios.get(`${API_BASE_URL}/api/websites/${websiteId}/accessibility`);
    return response.data.data;
  },

  generateAccessibilityRecommendations: async (websiteId: string | number, recommendationData: any) => {
    setupInterceptors();
    const response = await axios.post(`${API_BASE_URL}/api/websites/${websiteId}/recommendations`, recommendationData);
    return response.data.data;
  }
};

// Snapshot Service
export const snapshotService = {
  createSnapshot: async (websiteId: string | number, snapshotData: any) => {
    setupInterceptors();
    const response = await axios.post(`${API_BASE_URL}/api/websites/${websiteId}/snapshots`, snapshotData);
    return response.data.data;
  },

  getSnapshots: async (websiteId: string | number) => {
    setupInterceptors();
    const response = await axios.get(`${API_BASE_URL}/api/websites/${websiteId}/snapshots`);
    return response.data.data;
  },
};

// AI Chatbot Service
export const chatService = {
  processChat: async (chatData: {
    query: string;
    snapshotId: string;
    websiteId: string;
    conversationHistory: Array<{ role: string; content: string }>;
  }) => {
    setupInterceptors();
    const response = await axios.post(`${API_BASE_URL}/api/chat`, chatData);
    return response.data.data;
  },

  // Optional: Get suggested questions
  getSuggestedQuestions: async (snapshotId: string) => {
    setupInterceptors();
    const response = await axios.get(
      `${API_BASE_URL}/api/chat/suggestions/${snapshotId}`
    );
    return response.data.data;
  },
};

// Member Service
export const memberService = {
  getMembersByUser: async () => {
    setupInterceptors();
    const response = await axios.get(`${API_BASE_URL}/api/members`);
    return response.data.data;
  },

  createMember: async (memberData: any) => {
    setupInterceptors();
    const response = await axios.post(`${API_BASE_URL}/api/members`, memberData);
    return response.data.data;
  },

  updateMember: async (memberId: string | number, memberData: any) => {
    setupInterceptors();
    const response = await axios.put(`${API_BASE_URL}/api/members/${memberId}`, memberData);
    return response.data.data;
  },

  deleteMember: async (memberId: string | number) => {
    setupInterceptors();
    const response = await axios.delete(`${API_BASE_URL}/api/members/${memberId}`);
    return response.data.data;
  }
};

// Messages Service (Chat History)
export const messagesService = {
  getGroupMessages: async (params?: { limit?: number; before?: string }) => {
    setupInterceptors();
    const search = new URLSearchParams();
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.before) search.set('before', params.before);
    const response = await axios.get(`${API_BASE_URL}/api/messages/group${search.toString() ? `?${search.toString()}` : ''}`);
    return response.data.data as { messages: any[] };
  },
  getDmMessages: async (peerMemberId: string, params?: { limit?: number; before?: string }) => {
    setupInterceptors();
    const search = new URLSearchParams();
    if (params?.limit) search.set('limit', String(params.limit));
    if (params?.before) search.set('before', params.before);
    const response = await axios.get(`${API_BASE_URL}/api/messages/dm/${peerMemberId}${search.toString() ? `?${search.toString()}` : ''}`);
    return response.data.data as { messages: any[] };
  },
};

// Utility Service
export const utilityService = {
  // Generate code fixes for accessibility issues
  generateCodeFixes: async (issues: any[]) => {
    setupInterceptors();
    const response = await axios.post(`${API_BASE_URL}/api/accessibility/generate-fixes`, { issues });
    return response.data.data;
  }
};