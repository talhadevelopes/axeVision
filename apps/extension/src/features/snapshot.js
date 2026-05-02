function initializeSnapshots() {
  console.log("Initializing snapshots...");

  const historyList = document.getElementById("history-list");
  if (historyList) {
    historyList.innerHTML = `
      <div class="placeholder-message">
        <p>Snapshots are captured and stored in your team's dashboard.</p>
        <p>Click "Capture Snapshot" to take a snapshot of the current page.</p>
      </div>
    `;
  }

  const captureButton = document.getElementById("capture-snapshot");
  if (captureButton) {
    captureButton.addEventListener("click", async (e) => {
      e.preventDefault();
      console.log("Capture button clicked");
      await captureSnapshot();
    });
  }

  const viewDetailsBtn = document.getElementById("view-details");
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener("click", async () => {
      try {
        const tabs = await window.chrome.tabs.query({
          active: true,
          currentWindow: true,
        });
        if (!tabs[0]?.url) return;

        const url = new URL(tabs[0].url).hostname;
        const websites = await window.apiManager.getWebsites();
        const website = websites.find((w) => w.url === url);

        if (website) {
          const websiteId = website.id || website._id;
          const settings = await window.apiManager.getSettings();
          window.chrome.tabs.create({
            url: `${settings.dashboardUrl}/websites/${websiteId}`,
          });
        } else {
          alert(
            "This website is not being tracked yet. Capture a snapshot first."
          );
        }
      } catch (error) {
        console.error("Error opening details:", error);
        alert("Error opening details. Make sure you're authenticated.");
      }
    });
  }

  const refreshHistoryBtn = document.getElementById("refresh-history");
  if (refreshHistoryBtn) {
    refreshHistoryBtn.style.display = "none";
  }
}

async function captureSnapshot() {
  console.log("Starting snapshot capture...");

  if (!window.authManager || !window.authManager.isAuthenticated) {
    alert("Please authenticate first to capture snapshots.");
    return;
  }

  const snapshotStatus = document.getElementById("snapshot-status");
  const progressBar = document.getElementById("snapshot-progress");
  const progressFill = progressBar?.querySelector(".progress-fill");

  if (progressBar) progressBar.classList.add("active");
  if (progressFill) progressFill.style.width = "10%";
  if (snapshotStatus) {
    snapshotStatus.textContent = "Capturing content...";
    snapshotStatus.className = "status-message info";
  }

  try {
    const tabs = await window.chrome.tabs.query({
      active: true,
      currentWindow: true,
    });
    if (!tabs?.[0]?.id) throw new Error("No active tab found");

    const tabUrl = tabs[0].url;
    const url = new URL(tabUrl).hostname;

    if (progressFill) progressFill.style.width = "20%";

    const results = await window.chrome.scripting.executeScript({
      target: { tabId: tabs[0].id },
      func: () => {
        const startTime = performance.now();

        function extractStructuredContent() {
          const content = {
            headings: [],
            paragraphs: [],
            links: [],
            inputs: [],
            buttons: [],
            forms: [],
          };

          // Extract headings
          const headings = document.querySelectorAll("h1, h2, h3, h4, h5, h6");
          console.log(`Found ${headings.length} headings`);
          headings.forEach((h, index) => {
            if (index < 150) { 
              content.headings.push({
                level: parseInt(h.tagName.substring(1)),
                text: h.textContent?.trim().substring(0, 150) || "",
              });
            }
          });

          // Extract paragraphs
          const paragraphs = document.querySelectorAll("p");
          console.log(`Found ${paragraphs.length} paragraphs`);
          paragraphs.forEach((p, index) => {
            if (index < 100) { 
              const text = p.textContent?.trim() || "";
              if (text.length > 20) {
                content.paragraphs.push({ text: text.substring(0, 250) }); 
              }
            }
          });

          // Extract links
          const links = document.querySelectorAll("a[href]");
          console.log(`Found ${links.length} links`);
          
          // Smart filtering to keep important links
          const importantLinks = [];
          links.forEach((link, index) => {
            const href = link.getAttribute("href");
            if (!href || href.startsWith("javascript:")) return;
            
            const text = link.textContent?.trim() || "";
            
            if (text.length > 0 && text.length < 50) {
              importantLinks.push({ link, href, text, priority: 1 });
            }
            else if (!href.startsWith('http')) {
              importantLinks.push({ link, href, text, priority: 2 });
            }
            else if (!href.includes('facebook.com') && !href.includes('twitter.com') && 
                     !href.includes('instagram.com') && !href.includes('ads') && 
                     !href.includes('tracking')) {
              importantLinks.push({ link, href, text, priority: 3 });
            }
          });
          
          importantLinks
            .sort((a, b) => a.priority - b.priority)
            .slice(0, 75)
            .forEach(({ href, text }) => {
              content.links.push({
                href: href.substring(0, 500),
                text: text.substring(0, 200),
              });
            });
          
          console.log(`Stored ${content.links.length} important links (filtered from ${links.length})`);
        

          // Extract inputs
          const inputs = document.querySelectorAll("input, textarea, select");
          console.log(`Found ${inputs.length} inputs`);
          inputs.forEach((input, index) => {
            if (index < 50) {
              content.inputs.push({
                type: input.type || null,
                name: input.name?.substring(0, 50) || null,
                placeholder: input.placeholder?.substring(0, 100) || null,
              });
            }
          });

          // Extract buttons
          const buttons = document.querySelectorAll(
            'button, input[type="submit"]'
          );
          console.log(`Found ${buttons.length} buttons`);
          buttons.forEach((btn, index) => {
            if (index < 30) {
              content.buttons.push({
                text: (btn.textContent || btn.value || "")
                  .trim()
                  .substring(0, 80),
              });
            }
          });

          // Extract forms
          const forms = document.querySelectorAll("form");
          console.log(`Found ${forms.length} forms`);
          forms.forEach((form, index) => {
            if (index < 20) {
              content.forms.push({
                action: form.action || null,
                method: form.method || null,
              });
            }
          });

          return content;
        }

        const structuredContent = extractStructuredContent();
        const endTime = performance.now();
        const captureTime = endTime - startTime;

        // Performance logging
        const totalElements =
          structuredContent.headings.length +
          structuredContent.paragraphs.length +
          structuredContent.links.length +
          structuredContent.inputs.length +
          structuredContent.buttons.length +
          structuredContent.forms.length;

        console.log("=== CAPTURE METRICS ===");
        console.log(
          `Performance: ${Math.round(captureTime)}ms, ${totalElements} elements, ${Math.round((totalElements / captureTime) * 1000)} el/sec`
        );
        console.log("Element breakdown:", {
          headings: structuredContent.headings.length,
          paragraphs: structuredContent.paragraphs.length,
          links: structuredContent.links.length,
          inputs: structuredContent.inputs.length,
          buttons: structuredContent.buttons.length,
          forms: structuredContent.forms.length,
        });
        console.log("=====================");

        return {
          structuredContent,
          title: document.title,
          captureTime,
          totalElements, 
        };
      },
    });

    if (progressFill) progressFill.style.width = "60%";

    //Extract all values from the result
    const { structuredContent, title, captureTime, totalElements } =
      results[0].result;

    const websitePromise = window.apiManager.createWebsite({
      url,
      title: title || url,
      name: title || url,
    });

    function generateMinimalHTML(content) {
      let html = `<!DOCTYPE html>\n<html>\n<head>\n<title>${content.title || "Page"}</title>\n`;
      html += `<style>body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6; }</style>\n`;
      html += `</head>\n<body>\n`;

      content.headings.forEach((h) => {
        html += `<h${h.level}>${h.text}</h${h.level}>\n`;
      });

      content.paragraphs.forEach((p) => {
        html += `<p>${p.text}</p>\n`;
      });

      content.links.forEach((link) => {
        html += `<a href="${link.href}">${link.text}</a><br>\n`;
      });

      html += `</body>\n</html>`;
      return html;
    }

    if (progressFill) progressFill.style.width = "80%";

    const websiteData = await websitePromise;
    const websiteId =
      websiteData.id || websiteData._id || websiteData.websiteId;

    const snapshotPayload = {
      content: generateMinimalHTML(structuredContent),
      structuredContent,
      capturedAt: new Date().toISOString(),
      title,
      url: tabUrl,
      metadata: {
        elementCounts: {
          headings: structuredContent.headings.length,
          paragraphs: structuredContent.paragraphs.length,
          links: structuredContent.links.length,
          inputs: structuredContent.inputs.length,
          buttons: structuredContent.buttons.length,
          forms: structuredContent.forms.length,
        },
        performance: {
          captureTime: Math.round(captureTime),
          totalElements: totalElements,
          elementsPerSecond: Math.round((totalElements / captureTime) * 1000),
        },
      },
    };

    await window.apiManager.saveSnapshot(websiteId, snapshotPayload);

    if (progressFill) progressFill.style.width = "100%";

    if (snapshotStatus) {
      const c = snapshotPayload.metadata.elementCounts;
      snapshotStatus.textContent = `Captured: ${c.headings} headings, ${c.paragraphs} paragraphs, ${c.links} links, ${c.inputs} inputs, ${c.forms} forms`;
      snapshotStatus.className = "status-message success";
    }

    // Log to extension console too
    console.log("=== SNAPSHOT SAVED ===");
    console.log("Metadata:", snapshotPayload.metadata);
    console.log("===================");

    setTimeout(() => {
      if (progressBar) progressBar.classList.remove("active");
      if (progressFill) progressFill.style.width = "0%";
    }, 2000);
  } catch (error) {
    console.error("Snapshot error:", error);
    if (snapshotStatus) {
      snapshotStatus.textContent = `Error: ${error.message}`;
      snapshotStatus.className = "status-message error";
    }
    setTimeout(() => {
      if (progressBar) progressBar.classList.remove("active");
      if (progressFill) progressFill.style.width = "0%";
    }, 2000);
  }
}

window.initializeSnapshots = initializeSnapshots;
window.captureSnapshot = captureSnapshot;
