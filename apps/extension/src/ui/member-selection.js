// src/ui/member-selection.js

function showMemberSelection(userId, members) {
  const membersHtml = members
    .map(
      (member) => `
    <div style="border: 1px solid #ddd; padding: 10px; margin-bottom: 10px; border-radius: 5px; display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h3 style="margin: 0; font-size: 16px; color: var(--color-foreground);">${member.name} (${member.type})</h3>
        <p style="margin: 5px 0 0; font-size: 12px; color: var(--color-secondary);">Role: ${member.role}</p>
      </div>
      <button class="select-member-button primary-button" data-member-id="${member.memberId}" style="padding: 8px 15px; font-size: 12px;">Select</button>
    </div>
  `,
    )
    .join("")

  document.body.innerHTML = `
    <div style="padding: 20px; text-align: center; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
      <div style="max-width: 300px; width: 100%;">
        <h2 style="margin-bottom: 16px; color: var(--color-foreground);">Select Team Profile</h2>
        <p style="margin-bottom: 24px; color: var(--color-secondary); line-height: 1.5;">
          Your account has multiple team profiles. Please select one to proceed.
        </p>
        <div style="max-height: 200px; overflow-y: auto; margin-bottom: 20px;">
          ${membersHtml}
        </div>
        <button id="logout-from-selection" class="secondary-button" style="width: 100%; padding: 12px;">Logout</button>
      </div>
    </div>
  `

  document.querySelectorAll(".select-member-button").forEach((button) => {
    button.addEventListener("click", async (e) => {
      const memberId = e.target.dataset.memberId
      if (memberId) {
        e.target.textContent = "Selecting..."
        e.target.disabled = true
        try {
          const result = await window.authManager.selectMember(userId, memberId)
          if (result.success) {
            console.log("Member selected successfully, reloading popup.")
            location.reload()
          } else {
            alert(`Failed to select member: ${result.error}`)
            e.target.textContent = "Select"
            e.target.disabled = false
          }
        } catch (error) {
          console.error("Error during member selection:", error)
          alert("An error occurred during selection. Please try again.")
          e.target.textContent = "Select"
          e.target.disabled = false
        }
      }
    })
  })

  document.getElementById("logout-from-selection").addEventListener("click", async () => {
    if (confirm("Are you sure you want to logout?")) {
      await window.authManager.logout()
      location.reload()
    }
  })
}

// Make available globally
window.showMemberSelection = showMemberSelection;