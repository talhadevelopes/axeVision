import { Snapshot, AccessibilityIssue } from "../models";
import { AccessibilityAIRecommendationService } from "./aiService";

interface ChatContext {
  snapshotId: string;
  userId: string;
  websiteId: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export class ChatbotService {
  static async generateResponse(
    query: string,
    context: ChatContext,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // 1. Fetch current accessibility data
      const accessibilityContext =
        await this.buildAccessibilityContext(context);

      // 2. Build system prompt with rich context
      const systemPrompt = this.buildSystemPrompt(accessibilityContext);

      // 3. Build conversation messages
      const messages = this.buildConversationMessages(
        systemPrompt,
        query,
        conversationHistory
      );

      // 4. Call Gemini API
      const response = await AccessibilityAIRecommendationService.callGeminiAPI(
        messages,
        "GEMINI_API_KEY"
      );
      return response;
    } catch (error: any) {
      console.error("Chatbot service error:", error);
      throw new Error(error?.message || "Failed to generate chatbot response");
    }
  }

  private static async buildAccessibilityContext(
    context: ChatContext
  ): Promise<any> {
    try {
      // Get the specific snapshot
      const snapshot = await Snapshot.findById(context.snapshotId);

      if (!snapshot) {
        throw new Error("Snapshot not found");
      }

      // Get accessibility issues for this snapshot
      const issues = await AccessibilityIssue.find({
        snapshotId: context.snapshotId,
      });

      // Get historical snapshots for this website (last 5)
      const historicalSnapshots = await Snapshot.find({
        websiteId: context.websiteId,
        userId: context.userId,
        analyzedAt: { $exists: true },
      })
        .sort({ analyzedAt: -1 })
        .limit(5);

      // Calculate severity breakdown
      const severityBreakdown = this.calculateSeverityBreakdown(issues);

      // Get issue categories
      const issueCategories = this.categorizeIssues(issues);

      return {
        currentSnapshot: {
          id: snapshot._id.toString(),
          capturedAt: snapshot.capturedAt,
          analyzedAt: snapshot.analyzedAt,
          url: snapshot.url || "N/A",
        },
        issues: {
          total: issues.length,
          breakdown: severityBreakdown,
          categories: issueCategories,
          details: issues.map((issue: any) => ({
            type: issue.type,
            message: issue.message,
            selector: issue.selector,
            context: issue.context,
          })),
        },
        historical: {
          totalSnapshots: historicalSnapshots.length,
          snapshots: historicalSnapshots.map((s: any) => ({
            id: s._id.toString(),
            analyzedAt: s.analyzedAt,
          })),
        },
      };
    } catch (error) {
      console.error("Error building accessibility context:", error);
      return {
        currentSnapshot: null,
        issues: { total: 0, breakdown: {}, categories: {}, details: [] },
        historical: { totalSnapshots: 0, snapshots: [] },
      };
    }
  }

  private static buildSystemPrompt(accessibilityContext: any): string {
    const { currentSnapshot, issues } = accessibilityContext;

    return `You are an expert accessibility assistant for axeVision, a platform that helps teams fix accessibility issues.

**Current Context:**
- Website analyzed: ${currentSnapshot?.url || "Unknown"}
- Analysis date: ${currentSnapshot?.analyzedAt || "N/A"}
- Total issues found: ${issues.total}
- Severity breakdown:
  • Critical: ${issues.breakdown.Critical || 0}
  • High: ${issues.breakdown.High || 0}
  • Medium: ${issues.breakdown.Medium || 0}
  • Low: ${issues.breakdown.Low || 0}

**Your Role:**
1. Help developers understand and prioritize accessibility issues
2. Provide actionable code fixes with WCAG references
3. Explain accessibility concepts in simple terms
4. Suggest best practices for team workflow

**Guidelines:**
- Keep responses concise (2-4 paragraphs max)
- Always reference WCAG criteria when relevant
- Provide code examples when discussing fixes
- Prioritize user impact over technical details
- If asked about specific issues, reference the actual issues from the context above

**Issue Categories Found:**
${Object.entries(issues.categories)
        .map(([category, count]) => `- ${category}: ${count} issues`)
        .join("\n")}

Be helpful, actionable, and focus on solving the developer's immediate problem.`;
  }

  private static buildConversationMessages(
    systemPrompt: string,
    userQuery: string,
    history: ChatMessage[]
  ): any[] {
    const messages: any[] = [
      {
        role: "user",
        parts: [{ text: systemPrompt }],
      },
    ];

    // Add conversation history (last 4 messages to stay within token limits)
    const recentHistory = history.slice(-4);
    recentHistory.forEach((msg) => {
      messages.push({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    });

    // Add current user query
    messages.push({
      role: "user",
      parts: [{ text: userQuery }],
    });

    return messages;
  }

  private static calculateSeverityBreakdown(
    issues: any[]
  ): Record<string, number> {
    const breakdown: Record<string, number> = {
      Critical: 0,
      High: 0,
      Medium: 0,
      Low: 0,
    };

    issues.forEach((issue) => {
      const severity = issue.type || "Medium";
      if (breakdown[severity] !== undefined) {
        breakdown[severity]++;
      }
    });

    return breakdown;
  }

  private static categorizeIssues(issues: any[]): Record<string, number> {
    const categories: Record<string, number> = {};

    issues.forEach((issue) => {
      // Extract category from context or message
      let category = "Other";

      if (issue.context && issue.context.includes("Rule:")) {
        const ruleMatch = issue.context.match(/Rule:\s*([^\|]+)/);
        if (ruleMatch) {
          category = ruleMatch[1].trim();
        }
      }

      categories[category] = (categories[category] || 0) + 1;
    });

    return categories;
  }
}