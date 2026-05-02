// This is the service worker for the extension.

// Declare the chrome variable
const chrome = window.chrome

// Listen for messages from content scripts (e.g., from the dashboard)
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "dashboardAuthUpdate") {
    console.log("Background script: Received dashboardAuthUpdate message.")
    const payload = request.payload
    // Update chrome.storage.local with the new auth data
    chrome.storage.local.set(
      {
        authToken: payload.token,
        userId: payload.userId,
        onboarded: payload.onboarded,
        memberId: payload.memberId,
        memberType: payload.memberType,
        // Clear membersToSelect if it exists, as selection is now complete
        membersToSelect: null,
      },
      () => {
        console.log("Background script: chrome.storage.local updated with dashboard auth data.")
        // Optionally, send a message back to the popup to reload if it's open
        // This is handled by popup.js listening for "authSuccess"
        chrome.runtime.sendMessage({ action: "authSuccess" })
      },
    )
  }
})
