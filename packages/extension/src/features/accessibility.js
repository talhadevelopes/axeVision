async function captureAccessibilityIssues(tabId) {
  const results = await chrome.scripting.executeScript({
    target: { tabId },
    func: () => {
      const issues = [];

      // Missing lang
      if (!/<html[^>]*\blang=/.test(document.documentElement.outerHTML)) {
        issues.push({
          type: "Critical",
          message: "Missing language declaration in <html> tag",
          selector: "html",
        });
      }

      //Images without alt
      const images = document.querySelectorAll("img:not([alt])");
      if (images.length) {
        issues.push({
          type: "High",
          message: `${images.length} image(s) missing alt text`,
          context: Array.from(images)
            .slice(0, 3)
            .map((img) => img.outerHTML)
            .join("\n"),
        });
      }

      // Inputs without labels
      const unlabeledInputs = Array.from(
        document.querySelectorAll("input,select,textarea")
      ).filter(
        (i) =>
          i.type !== "hidden" &&
          !(i.id && document.querySelector(`label[for="${i.id}"]`)) &&
          !i.closest("label") &&
          !i.getAttribute("aria-label") &&
          !i.getAttribute("aria-labelledby")
      );
      if (unlabeledInputs.length) {
        issues.push({
          type: "High",
          message: `${unlabeledInputs.length} input(s) without labels`,
          context: unlabeledInputs
            .slice(0, 3)
            .map((i) => i.outerHTML)
            .join("\n"),
        });
      }

      // Empty headings
      const emptyHeadings = Array.from(
        document.querySelectorAll("h1,h2,h3,h4,h5,h6")
      ).filter((h) => !h.textContent.trim());
      if (emptyHeadings.length) {
        issues.push({
          type: "Medium",
          message: `${emptyHeadings.length} empty heading(s)`,
          context: emptyHeadings.map((h) => h.outerHTML).join("\n"),
        });
      }

      // Missing title
      if (!document.title) {
        issues.push({
          type: "Medium",
          message: "Document is missing a <title>",
        });
      }

      return {
        html: document.documentElement.outerHTML,
        issues,
        url: location.href,
      };
    },
  });

  return results[0].result;
}

function renderAccessibilityResults(
  allIssues,
  targetId = "accessibility-results"
) {
  const container = document.getElementById(targetId);
  if (!allIssues.length) {
    container.innerHTML = `<div class="placeholder-message success">No accessibility issues found!</div>`;
    return;
  }

  // Sort by severity
  const severityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  allIssues.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);

  const summary = ["Critical", "High", "Medium", "Low"]
    .map(
      (level) => `<div class="summary-item">
        <span class="count">${allIssues.filter((i) => i.type === level).length}</span>
        <span class="label">${level}</span>
      </div>`
    )
    .join("");

  const issuesHTML = allIssues
    .map(
      (issue, i) => `
      <div class="issue" data-type="${issue.type.toLowerCase()}" id="issue-${i}">
        <span class="issue-badge ${issue.type.toLowerCase()}">${issue.type}</span>
        <div class="issue-message">${issue.message}</div>
        ${issue.context ? `<pre class="issue-context">${issue.context}</pre>` : ""}
      </div>`
    )
    .join("");

  container.innerHTML = `
    <div class="issues-summary">${summary}</div>
    <div class="issues-list">${issuesHTML}</div>
  `;
}

async function runAccessibilityCheck() {
  const resultsEl = document.getElementById("accessibility-results");
  // show a step/logging UI so user sees progress and timings
  resultsEl.innerHTML = `
    <div id="accessibility-loading" class="loading-indicator"><span class="loading-spinner" aria-hidden="true"></span> <span id="accessibility-loading-text">Analyzing...</span></div>
    <div id="accessibility-steps" class="accessibility-log" aria-live="polite" style="margin-top:8px"></div>
    <div id="accessibility-results-inner" class="accessibility-results-inner" style="margin-top:8px"></div>
  `;

  // Ensure minimal inline CSS for issues is present (fallback if popup.css didn't load)
  if (!document.getElementById("accessibility-inline-styles")) {
    const s = document.createElement("style");
    s.id = "accessibility-inline-styles";
    s.textContent = `
      .issues-summary{display:flex;gap:8px;margin-bottom:8px;padding:8px;background:#f3f4f6;border-radius:6px}
      .issue{border:1px solid #e5e7eb;border-left-width:4px;border-radius:6px;padding:10px;background:#fff;margin-bottom:8px}
      .issue .issue-message{margin:6px 0}
      .issue-badge{display:inline-block;font-size:12px;font-weight:600;padding:2px 6px;border-radius:4px;margin-right:6px}
      .issue-badge.critical{background:#ff4d4f;color:#fff}
      .issue-badge.high{background:#fa8c16;color:#fff}
      .issue-badge.medium{background:#fadb14;color:#000}
      .issue-badge.low{background:#52c41a;color:#fff}
      .issue-context{font-family:monospace;font-size:12px;background:#fafafa;padding:6px;border-radius:4px;white-space:pre-wrap}
    `;
    document.head.appendChild(s);
  }

  const loadingEl = document.getElementById("accessibility-loading");
  const stepsEl = document.getElementById("accessibility-steps");
  const innerEl = document.getElementById("accessibility-results-inner");

  const logStep = (text, ms) => {
    try {
      if (!stepsEl) return;
      const now = new Date();
      const time = now.toLocaleTimeString();
      const div = document.createElement("div");
      div.className = "accessibility-log-line";
      div.textContent =
        `[${time}] ${text}` +
        (typeof ms === "number" ? ` (${Math.round(ms)} ms)` : "");
      stepsEl.appendChild(div);
      // keep log short
      while (stepsEl.children.length > 60)
        stepsEl.removeChild(stepsEl.firstChild);
    } catch (e) {
      console.warn("logStep error", e);
    }
  };

  const updateLoading = (txt) => {
    const t = document.getElementById("accessibility-loading-text");
    if (t) t.textContent = txt;
  };

  try {
    if (!window.authManager?.isAuthenticated)
      throw new Error("Not authenticated");

    const [tab] = await chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tab?.id) throw new Error("No active tab found");

    logStep("Starting DOM capture");
    const captureStart = performance.now();
    const { html, issues, url } = await captureAccessibilityIssues(tab.id);
    const captureMs = performance.now() - captureStart;
    logStep("Captured DOM", captureMs);
    logStep(`Captured issues: ${Array.isArray(issues) ? issues.length : 0}`);

    // AI analysis step with timing and logs
    updateLoading("Running accessibility analysis...");
    logStep("Analyzing with axe-core");

    const aiStart = performance.now();
    let aiIssues = [];
    // heartbeat while waiting for AI (updates every 1s)
    let heartbeatCount = 0;
    const hb = setInterval(() => {
      heartbeatCount += 1;
      updateLoading(`Analyzing accessibility... ${heartbeatCount}s`);
      // append a short heartbeat log every 3 seconds
      if (heartbeatCount % 3 === 0)
        logStep(`Analysis in progress... ${heartbeatCount}s`);
    }, 1000);
    try {
      const ai = await window.apiManager.analyzeAccessibility(html);
      const aiMs = performance.now() - aiStart;
      aiIssues = ai && Array.isArray(ai.issues) ? ai.issues : [];
      logStep(`Accessibility analysis completed`, aiMs);
      logStep(`Detected issues: ${aiIssues.length}`);
    } catch (e) {
      const aiMs = performance.now() - aiStart;
      logStep(`AI failed: ${e && e.message ? e.message : String(e)}`, aiMs);
      console.warn("AI analysis failed:", e);
    } finally {
      clearInterval(hb);
      updateLoading("Processing results...");
    }

    updateLoading("Rendering results...");
    try {
      const combined = [...(issues || []), ...aiIssues];
      renderAccessibilityResults(combined, "accessibility-results-inner");
      logStep("Rendered full results");
      updateLoading("Done");
    } catch (rErr) {
      console.warn("Failed to render results:", rErr);
      logStep(
        "Render failed: " + (rErr && rErr.message ? rErr.message : String(rErr))
      );
    }

    // Save results and log timing; skip save if no issues
    // combined already defined above if used; recompute to be safe
    const combined = [...(issues || []), ...aiIssues];
    if (!combined.length) {
      logStep("No issues found; skipping save");
      updateLoading("Done");
      return;
    }

    updateLoading("Saving results...");
    logStep("Saving results to backend");
    try {
      const saveStart = performance.now();
      const hostname = new URL(url).hostname;
      const website = await window.apiManager.createWebsite({
        url: hostname,
        name: hostname,
      });
      const payload = {
        issues: combined,
        analyzedAt: new Date().toISOString(),
      };
      await window.apiManager.saveAccessibilityResults(
        website.id || website._id,
        payload
      );
      const saveMs = performance.now() - saveStart;
      logStep("Save completed", saveMs);
      updateLoading("Done");
    } catch (saveErr) {
      console.warn("Failed to save accessibility results:", saveErr);
      logStep(
        "Save failed: " +
          (saveErr && saveErr.message ? saveErr.message : String(saveErr))
      );
      updateLoading("Done (save failed)");
    }
  } catch (err) {
    console.error("Accessibility check error:", err);
    if (innerEl)
      innerEl.innerHTML = `<div class="placeholder-message error">Error: ${err.message}</div>`;
    updateLoading("Error");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const runButton = document.getElementById("run-accessibility");
  if (runButton) runButton.addEventListener("click", runAccessibilityCheck);
});

//window.initializeAccessibility = runAccessibilityCheck;