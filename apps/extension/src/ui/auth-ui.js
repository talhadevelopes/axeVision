document.addEventListener("DOMContentLoaded", () => {
  const authForm = document.getElementById("auth-form")
  const authTitle = document.getElementById("auth-title")
  const authSubtitle = document.getElementById("auth-subtitle")
  const authSubmit = document.getElementById("auth-submit")
  const authSubmitText = document.getElementById("auth-submit-text")
  const authToggleText = document.getElementById("auth-toggle-text")
  const authToggleBtn = document.getElementById("auth-toggle-btn")
  const authMessage = document.getElementById("auth-message")
  const teamEmail = document.getElementById("team-email")
  const teamPassword = document.getElementById("team-password")

  let isLoginMode = true

  // Declare chrome variable
  const chrome = window.chrome

  // Toggle between login and register
  authToggleBtn.addEventListener("click", () => {
    isLoginMode = !isLoginMode
    updateUI()
  })

  function updateUI() {
    if (isLoginMode) {
      authTitle.textContent = "Join Team"
      authSubtitle.textContent = "Enter team credentials to access snapshots"
      authSubmitText.textContent = "Join Team"
      authToggleText.textContent = "Don't have a team?"
      authToggleBtn.textContent = "Create New Team"
    } else {
      authTitle.textContent = "Create Team"
      authSubtitle.textContent = "Create a new team to start capturing snapshots"
      authSubmitText.textContent = "Create Team"
      authToggleText.textContent = "Already have a team?"
      authToggleBtn.textContent = "Join Existing Team"
    }
    clearMessage()
  }

  // Handle form submission
  authForm.addEventListener("submit", async (e) => {
    e.preventDefault()

    const email = teamEmail.value.trim()
    const password = teamPassword.value.trim()

    if (!email || !password) {
      showMessage("Please fill in all fields", "error")
      return
    }

    // Show loading state
    authSubmit.disabled = true
    authSubmitText.textContent = isLoginMode ? "Joining..." : "Creating..."

    try {
      let result
      if (isLoginMode) {
        result = await window.authManager.login(email, password)
      } else {
        result = await window.authManager.register(email, password)
      }

      if (result.success) {
        showMessage(isLoginMode ? "Successfully joined team!" : "Team created successfully!", "success")

        // Close auth window and open main popup after short delay
        setTimeout(() => {
          window.close()
          chrome.action.openPopup()
        }, 1500)
      } else {
        showMessage(result.error || "Authentication Successful", "error")
      }
    } catch (error) {
      showMessage("Network error. Please try again.", "error")
      console.error("Auth error:", error)
    } finally {
      // Reset button state
      authSubmit.disabled = false
      authSubmitText.textContent = isLoginMode ? "Join Team" : "Create Team"
    }
  })

  function showMessage(text, type) {
    authMessage.textContent = text
    authMessage.className = type === "error" ? "error-message" : "success-message"
  }

  function clearMessage() {
    authMessage.textContent = ""
    authMessage.className = ""
  }
})
