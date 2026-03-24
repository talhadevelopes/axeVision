import { AccessibilityIssueDTO } from "@axeVision/shared";
import puppeteer from "puppeteer";
import { AxePuppeteer } from "@axe-core/puppeteer";

export class AccessibilityService {
  static async analyzeHtml(html: string): Promise<AccessibilityIssueDTO[]> {
    try {
      console.log("Starting axe-core accessibility analysis...");
      const startTime = Date.now();

      // Use axe-core's built-in HTML analysis
      const results = await this.runAxeOnHtml(html);

      const analysisTime = Date.now() - startTime;
      console.log(`Axe-core analysis completed in ${analysisTime}ms`);

      // Convert axe results to our DTO format
      const issues: AccessibilityIssueDTO[] = [];

      // Process violations (definite issues)
      if (results.violations) {
        results.violations.forEach((violation: any) => {
          const severity = this.mapAxeSeverityToType(violation.impact);

          violation.nodes.forEach((node: any) => {
            issues.push({
              type: severity,
              message: `${violation.description} - ${node.failureSummary || violation.help}`,
              selector: Array.isArray(node.target)
                ? node.target.join(", ")
                : node.target,
              context: `Rule: ${violation.id} | WCAG: ${violation.tags?.filter((tag: string) => tag.startsWith("wcag")).join(", ") || "N/A"}`,
            });
          });
        });
      }

      // Process incomplete results (potential issues that need review)
      if (results.incomplete) {
        results.incomplete.forEach((incomplete: any) => {
          incomplete.nodes.forEach((node: any) => {
            issues.push({
              type: "Medium",
              message: `Needs Review: ${incomplete.description} - ${node.failureSummary || incomplete.help}`,
              selector: Array.isArray(node.target)
                ? node.target.join(", ")
                : node.target,
              context: `Rule: ${incomplete.id} | WCAG: ${incomplete.tags?.filter((tag: string) => tag.startsWith("wcag")).join(", ") || "N/A"}`,
            });
          });
        });
      }

      console.log(
        `Found ${issues.length} accessibility issues (${results.violations?.length || 0} violations, ${results.incomplete?.length || 0} incomplete)`
      );

      return issues;
    } catch (error: any) {
      console.error("Axe-core analysis error:", error.message);
      throw new Error("Failed to analyze accessibility with axe-core");
    }
  }

  /**
   * Run axe-core analysis on HTML string using Puppeteer
   */
  private static async runAxeOnHtml(html: string): Promise<any> {
    let browser;
    try {
      // Launch headless browser
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      const page = await browser.newPage();

      // Set the HTML content
      await page.setContent(html, { waitUntil: "domcontentloaded" });

      // Run axe-core analysis
      const results = await new AxePuppeteer(page)
        .withTags(["wcag2a", "wcag2aa", "wcag21aa", "best-practice"])
        .analyze();

      return results;
    } catch (error) {
      console.error("Puppeteer axe analysis failed:", error);
      // Fallback to regex-based analysis
      return this.runBasicAccessibilityChecks(html);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  /**
   * Fallback regex-based accessibility checks
   */
  private static runBasicAccessibilityChecks(html: string): any {
    const issues = {
      violations: [] as any[],
      incomplete: [] as any[],
    };

    // Basic accessibility checks
    const checks = [
      {
        id: "image-alt",
        description: "Images must have alternate text",
        impact: "critical",
        regex: /<img(?![^>]*alt=)[^>]*>/gi,
        help: "Add alt attribute to images",
      },
      {
        id: "form-labels",
        description: "Form inputs must have labels",
        impact: "critical",
        regex:
          /<input(?![^>]*(?:aria-label|aria-labelledby))[^>]*type=["'](?:text|email|password|number)["'][^>]*>/gi,
        help: "Add labels or ARIA attributes to form inputs",
      },
      {
        id: "button-name",
        description: "Buttons must have accessible names",
        impact: "serious",
        regex:
          /<button(?![^>]*(?:aria-label|aria-labelledby))[^>]*>\s*<\/button>/gi,
        help: "Add text content or ARIA labels to buttons",
      },
      {
        id: "link-name",
        description: "Links must have accessible names",
        impact: "serious",
        regex: /<a(?![^>]*(?:aria-label|aria-labelledby))[^>]*>\s*<\/a>/gi,
        help: "Add text content or ARIA labels to links",
      },
    ];

    checks.forEach((check) => {
      const matches = html.match(check.regex);
      if (matches) {
        matches.forEach((match, index) => {
          issues.violations.push({
            id: check.id,
            description: check.description,
            impact: check.impact,
            help: check.help,
            tags: ["wcag2a", "wcag2aa"],
            nodes: [
              {
                target: [`${check.id}-violation-${index + 1}`],
                failureSummary: `Found: ${match.substring(0, 100)}...`,
              },
            ],
          });
        });
      }
    });

    return issues;
  }

  /**
   * Map axe-core severity levels to our DTO types
   */
  private static mapAxeSeverityToType(impact: string | undefined): string {
    switch (impact) {
      case "critical":
        return "Critical";
      case "serious":
        return "High";
      case "moderate":
        return "Medium";
      case "minor":
        return "Low";
      default:
        return "Medium";
    }
  }
}