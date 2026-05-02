// Authentication manager for the extension
class AuthManager {
  constructor() {
    this.token = null
    this.isAuthenticated = false
    this.userId = null 
    this.memberId = null 
    this.memberType = null 
  }

  // Check if user is authenticated
  async checkAuth() {
    try {
      const result = await window.chrome.storage.local.get(["authToken", "userId", "memberId", "memberType"])
      if (result.authToken && result.userId && result.memberId && result.memberType) {
        this.token = result.authToken
        this.userId = result.userId
        this.memberId = result.memberId
        this.memberType = result.memberType
        this.isAuthenticated = true
        return true
      }
      return false
    } catch (error) {
      console.error("Auth check failed:", error)
      return false
    }
  }

  // Login with team credentials
  async login(email, password) {
    try {
      const settings = await this.getSettings()
      const response = await fetch(`${settings.apiUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Login failed")
      }

      const data = await response.json()
      const body = data && typeof data === 'object' && 'data' in data ? data.data : data
      console.log("Login response data:", body)

      if (body && Array.isArray(body.members) && body.members.length > 0) {
        // Multiple members found, store userId and members for in-extension selection
        await window.chrome.storage.local.set({
          userId: body.userId,
          membersToSelect: body.members, 
          teamCredentials: { email, password }, 
        })
        return { success: false, needsMemberSelection: true, userId: body.userId, members: body.members }
      } else if (body && body.token) {
        // Single member or non-onboarded user, token is directly provided
        this.token = body.token
        this.isAuthenticated = true
        this.userId = body.userId || null
        this.memberId = body.memberId || null
        this.memberType = body.memberType || null

        await window.chrome.storage.local.set({
          authToken: body.token,
          teamCredentials: { email, password },
          userId: body.userId,
          memberId: body.memberId,
          memberType: body.memberType,
        })
        // Clear any lingering membersToSelect if a direct login succeeded
        await window.chrome.storage.local.remove("membersToSelect")
        return { success: true, token: body.token }
      } else {
        throw new Error("Unexpected login response: No token or members provided.")
      }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: error.message }
    }
  }

  // Logout
  async logout() {
    this.token = null
    this.isAuthenticated = false
    this.userId = null
    this.memberId = null
    this.memberType = null
    await window.chrome.storage.local.remove([
      "authToken",
      "teamCredentials",
      "userId",
      "memberId",
      "memberType",
      "membersToSelect", 
    ])
  }

  // Get auth headers for API calls
  getAuthHeaders() {
    if (!this.token) {
      throw new Error("Not authenticated")
    }
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
    }
  }

  // Get settings
  async getSettings() {
    return new Promise((resolve) => {
      window.chrome.storage.sync.get(
        {
          apiUrl: "http://localhost:4000",
          dashboardUrl: "http://localhost:5173", 
        },
        resolve,
      )
    })
  }

  // Auto-login on extension startup
  async autoLogin() {
    try {
      // First, check if we already have a full auth state (from dashboard sync or previous direct login)
      const isAuthenticatedFromStorage = await this.checkAuth()
      if (isAuthenticatedFromStorage) {
        console.log("Auto-login: Already authenticated from storage.")
        return { success: true, token: this.token }
      }

      // If not fully authenticated, try with saved credentials
      const result = await window.chrome.storage.local.get(["teamCredentials", "membersToSelect", "userId"])

      // If membersToSelect exists, it means a previous auto-login attempt resulted in multiple members
      // and the user needs to select one in the extension.
      if (result.membersToSelect && result.membersToSelect.length > 0 && result.userId) {
        console.log("Auto-login: Found membersToSelect, prompting for in-extension selection.")
        return { success: false, needsMemberSelection: true, userId: result.userId, members: result.membersToSelect }
      }

      // If no membersToSelect, try to re-login with saved credentials
      if (result.teamCredentials) {
        console.log("Auto-login: Trying to re-login with saved credentials.")
        const { email, password } = result.teamCredentials
        // Call the login method, which will handle storing the token/membersToSelect
        return await this.login(email, password)
      }

      console.log("Auto-login: No saved credentials or pending member selection.")
      return { success: false, error: "No saved credentials" }
    } catch (error) {
      console.error("Auto-login failed:", error)
      return { success: false, error: error.message }
    }
  }

  //Function to select a member profile within the extension
  async selectMember(userId, memberId) {
    try {
      const settings = await this.getSettings()
      const response = await fetch(`${settings.apiUrl}/api/auth/select-member`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, memberId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to select member profile.")
      }

      const data = await response.json()
      const body = data && typeof data === 'object' && 'data' in data ? data.data : data
      console.log("Member selection response data:", body)

      if (!body || !body.token) {
        throw new Error("Member selection successful, but no token received from server.")
      }

      this.token = body.token
      this.isAuthenticated = true
      this.userId = body.userId || null
      this.memberId = body.memberId || null
      this.memberType = body.memberType || null

      await window.chrome.storage.local.set({
        authToken: body.token,
        userId: body.userId,
        memberId: body.memberId,
        memberType: body.memberType,
      })
      // Clear membersToSelect after successful selection
      await window.chrome.storage.local.remove("membersToSelect")
      return { success: true, token: body.token }
    } catch (error) {
      console.error("Select member error:", error)
      return { success: false, error: error.message }
    }
  }
}

// Create global auth manager instance
window.authManager = new AuthManager()
