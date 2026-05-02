document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup DOM loaded, initializing...")

  // Wait for auth manager
  let attempts = 0
  while (!window.authManager && attempts < 10) {
    await new Promise((resolve) => setTimeout(resolve, 100))
    attempts++
  }
  if (!window.authManager) {
    console.error("Auth manager not loaded after waiting")
    return
  }

  console.log("Auth manager available, checking authentication...")
  const isAuthenticated = await window.authManager.checkAuth()
  console.log("Authentication status:", isAuthenticated)

  if (!isAuthenticated) {
    console.log("Not authenticated, trying auto-login...")
    const autoLoginResult = await window.authManager.autoLogin()
    console.log("Auto-login result:", autoLoginResult)

    if (autoLoginResult.needsMemberSelection) {
      // Use the member-selection.js function
      window.showMemberSelection(autoLoginResult.userId, autoLoginResult.members)
      return
    } else if (!autoLoginResult.success) {
      showAuthRequired()
      return
    }
  }

  console.log("User authenticated, initializing popup...")
  initializePopup()
})

// Listen for background messages (auth success, member selection)
window.chrome.runtime.onMessage.addListener((request) => {
  if (request.action === "authSuccess" || request.action === "memberSelected") {
    console.log("Auth success message received, reloading popup.")
    location.reload()
  }
})

// --- UI Helpers ---

function showAuthRequired() {
  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <div style="max-width: 300px;">
        <h2 style="margin-bottom: 16px; color: var(--color-foreground);">Team Authentication Required</h2>
        <p style="margin-bottom: 24px; color: var(--color-secondary); line-height: 1.5;">
          Please authenticate with your team credentials to access WebLenses snapshots and features.
        </p>
        <button id="open-auth" class="primary-button" style="width: 100%; padding: 12px;">
          Authenticate with Team
        </button>
      </div>
    </div>
  `
  document.getElementById("open-auth").addEventListener("click", () => {
    window.chrome.windows.create({
      url: window.chrome.runtime.getURL("auth.html"),
      type: "popup",
      width: 400,
      height: 550,
    })
  })
}

function initializePopup() {
  console.log("Initializing popup functionality...")
  addLogoutButton()
  initializeTabs()
  initializePageInfo()
  initializeSnapshots();
  initializeChatbot();  
  initializeAccessibility();
  console.log("Popup initialization complete")
}

function addLogoutButton() {
  const header = document.querySelector(".app-header")
  const themeToggle = header.querySelector(".theme-toggle")
  const logoutBtn = document.createElement("button")
  logoutBtn.textContent = "Logout"
  logoutBtn.className = "icon-button"
  logoutBtn.title = "Logout from Team"
  logoutBtn.style.marginLeft = "8px"
  logoutBtn.addEventListener("click", async () => {
    if (confirm("Are you sure you want to logout?")) {
      await window.authManager.logout()
      location.reload()
    }
  })
  header.insertBefore(logoutBtn, themeToggle)
}

function initializeTabs() {
  const tabs = document.querySelectorAll(".tab-button")
  const contents = document.querySelectorAll(".tab-content")
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      tabs.forEach((t) => t.classList.remove("active"))
      contents.forEach((c) => c.classList.remove("active"))
      tab.classList.add("active")
      document.getElementById(`${tab.dataset.tab}-content`).classList.add("active")
    })
  })
}

function initializePageInfo() {
  const pageUrl = document.getElementById("page-url")
  const trackingStatus = document.getElementById("tracking-status")

  window.chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    if (tabs[0]?.url) {
      try {
        const url = new URL(tabs[0].url)
        pageUrl.textContent = url.hostname
        await checkTrackingStatus(url.hostname)
      } catch (e) {
        console.error("Invalid URL:", e)
        pageUrl.textContent = "Unknown"
      }
    } else {
      pageUrl.textContent = "Unknown"
    }
  })

  async function checkTrackingStatus(hostname) {
    try {
      if (!window.authManager.isAuthenticated) {
        trackingStatus.textContent = "Not authenticated"
        return
      }
      const settings = await window.authManager.getSettings()
      const response = await fetch(`${settings.apiUrl}/api/websites`, {
        headers: window.authManager.getAuthHeaders(),
      })
      if (!response.ok) throw new Error(`Failed to fetch websites: ${response.statusText}`)
      const websites = await response.json()
      const isTracked = websites.some((w) => w.url === hostname)
      trackingStatus.textContent = isTracked ? "Tracked" : "Not tracked"
      if (isTracked) trackingStatus.classList.add("tracked")
      else trackingStatus.classList.remove("tracked")
    } catch (error) {
      console.error("Error checking tracking status:", error)
      trackingStatus.textContent = "Status unknown"
      trackingStatus.classList.remove("tracked")
    }
  }
}