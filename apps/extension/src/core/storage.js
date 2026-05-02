// Storage utility functions
class StorageManager {
  constructor() {
    this.chrome = window.chrome;
  }

  async getAuthData() {
    return this.chrome.storage.local.get([
      "authToken", 
      "userId", 
      "memberId", 
      "memberType",
      "membersToSelect",
      "teamCredentials"
    ]);
  }

  async setAuthData(authData) {
    return this.chrome.storage.local.set(authData);
  }

  async clearAuthData() {
    return this.chrome.storage.local.remove([
      "authToken",
      "teamCredentials",
      "userId",
      "memberId",
      "memberType",
      "membersToSelect"
    ]);
  }

  async getSettings() {
    return this.chrome.storage.sync.get({
      apiUrl: "http://localhost:4000",
      dashboardUrl: "http://localhost:5173",
    });
  }

  async setSettings(settings) {
    return this.chrome.storage.sync.set(settings);
  }
}

// Create global storage manager instance
window.storageManager = new StorageManager();