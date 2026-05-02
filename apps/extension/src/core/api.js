// API utility functions
class ApiManager {
  constructor() {
    this.settings = null;
  }

  async getSettings() {
    if (!this.settings) {
      this.settings = await new Promise((resolve) => {
        chrome.storage.sync.get(
          {
            apiUrl: "http://localhost:4000",
            dashboardUrl: "http://localhost:5173",
          },
          resolve
        );
      });
    }
    return this.settings;
  }

  async makeAuthenticatedRequest(url, options = {}) {
    if (!window.authManager || !window.authManager.isAuthenticated) {
      throw new Error("Not authenticated");
    }

    const settings = await this.getSettings();
    const fullUrl = url.startsWith("http") ? url : `${settings.apiUrl}${url}`;

    const defaultOptions = {
      headers: window.authManager.getAuthHeaders(),
    };

    return fetch(fullUrl, { ...defaultOptions, ...options });
  }

  async createWebsite(websiteData) {
    const response = await this.makeAuthenticatedRequest("/api/websites", {
      method: "POST",
      body: JSON.stringify(websiteData),
    });

    const json = await response.json().catch(() => ({}));
    if (!response.ok && response.status !== 409) {
      const body = json && typeof json === 'object' && 'message' in json ? json : (json?.data ?? json);
      throw new Error(body?.error || body?.message || response.statusText);
    }
    const body = json && typeof json === 'object' && 'data' in json ? json.data : json;
    return body;
  }

  async saveSnapshot(websiteId, snapshotData) {
    const res = await this.makeAuthenticatedRequest(
      `/api/websites/${websiteId}/snapshots`,
      {
        method: "POST",
        body: JSON.stringify(snapshotData),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const body = json && typeof json === 'object' && 'message' in json ? json : (json?.data ?? json);
      throw new Error(body?.error || body?.message || res.statusText);
    }
    return (json && json.data) ? json.data : json;
  }

  async saveAccessibilityResults(websiteId, accessibilityData) {
    const res = await this.makeAuthenticatedRequest(
      `/api/websites/${websiteId}/accessibility`,
      {
        method: "POST",
        body: JSON.stringify(accessibilityData),
      }
    );
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const body = json && typeof json === 'object' && 'message' in json ? json : (json?.data ?? json);
      throw new Error(body?.error || body?.message || res.statusText);
    }
    return (json && json.data) ? json.data : json;
  }

  async analyzeAccessibility(htmlContent) {
    const settings = await this.getSettings();
    const response = await fetch(
      `${settings.apiUrl}/api/accessibility/analyze-accessibility`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: htmlContent }),
      }
    );

    if (!response.ok) {
      const json = await response.json().catch(() => ({}));
      const body = json && typeof json === 'object' && 'message' in json ? json : (json?.data ?? json);
      throw new Error(`AI analysis failed: ${body?.error || body?.message || response.statusText}`);
    }
    const json = await response.json().catch(() => ({}));
    return (json && json.data) ? json.data : json;
  }

  async getWebsites() {
    const response = await this.makeAuthenticatedRequest("/api/websites");
    if (!response.ok) {
      throw new Error(`Failed to fetch websites: ${response.statusText}`);
    }
    const json = await response.json().catch(() => ({}));
    return (json && json.data) ? json.data : json;
  }

  async chat(question, textContent, url, expertType = "tech") {
    const response = await this.makeAuthenticatedRequest("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, textContent, url, expertType }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const body = errorData && typeof errorData === 'object' && 'message' in errorData ? errorData : (errorData?.data ?? errorData);
      throw new Error(body?.error || body?.message || "Chat request failed");
    }
    const json = await response.json().catch(() => ({}));
    return (json && json.data) ? json.data : json; // unwrap to get { answer }
  }
}
// Create global API manager instance
window.apiManager = new ApiManager();
