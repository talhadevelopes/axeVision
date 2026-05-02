import { AccessibilityIssueDTO } from "@axeVision/shared";

const MAX_PROMPT_FIELD = 800;

export type GeminiCallOptions = {
    maxOutputTokens?: number;
    temperature?: number;
    responseMimeType?: string;
    responseSchema?: Record<string, unknown>;
};

function truncateForPrompt(value: string | undefined, max = MAX_PROMPT_FIELD): string {
    const s = (value ?? "").replace(/\s+/g, " ").trim();
    if (s.length <= max) return s;
    return `${s.slice(0, max)}…`;
}

/** Gemini structured-output schema (OpenAPI subset) for code + explanation. */
const CODE_FIX_RESPONSE_SCHEMA = {
    type: "object",
    properties: {
        code: {
            type: "string",
            description:
                "Minimal HTML or CSS snippet. Use empty string when no concrete fix applies. Keep short.",
        },
        explanation: {
            type: "string",
            description:
                "1–3 sentences: actionable fix or verification steps; cite WCAG when relevant. Never empty.",
        },
        wcagCriterion: {
            type: "string",
            description:
                "The specific WCAG 2.1 criterion this issue violates, e.g. '1.1.1 Non-text Content (Level A)'. Empty string if not applicable.",
        },
        impactSummary: {
            type: "string",
            description:
                "One sentence describing who is affected and how, e.g. 'Screen reader users cannot identify the purpose of this input field.'",
        },
        effortLevel: {
            type: "string",
            description: "Developer effort to fix: Low (< 5 min), Medium (< 30 min), or High (> 30 min).",
            enum: ["Low", "Medium", "High"],
        },
        testingTip: {
            type: "string",
            description:
                "One sentence on how to verify the fix worked, e.g. 'Use NVDA + Chrome and confirm the label text is announced when focusing the input.'",
        },
    },
    required: ["code", "explanation"],
};

export class AccessibilityAIRecommendationService {

    static parseCodeFixJson(text: string): {
        code: string;
        explanation: string;
        wcagCriterion?: string;
        impactSummary?: string;
        effortLevel?: string;
        testingTip?: string;
    } | null {
        const trimmed = text.trim();
        if (!trimmed) return null;
        let s = trimmed.replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```\s*$/i, "");

        const extract = (raw: Record<string, unknown>) => ({
            code: typeof raw.code === "string" ? raw.code : "",
            explanation: (raw.explanation as string).trim(),
            wcagCriterion: typeof raw.wcagCriterion === "string" ? raw.wcagCriterion : undefined,
            impactSummary: typeof raw.impactSummary === "string" ? raw.impactSummary : undefined,
            effortLevel: typeof raw.effortLevel === "string" ? raw.effortLevel : undefined,
            testingTip: typeof raw.testingTip === "string" ? raw.testingTip : undefined,
        });

        try {
            const parsed = JSON.parse(s) as Record<string, unknown>;
            if (typeof parsed.explanation === "string" && parsed.explanation.trim()) {
                return extract(parsed);
            }
        } catch {
            const jsonMatch = s.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                try {
                    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;
                    if (typeof parsed.explanation === "string" && parsed.explanation.trim()) {
                        return extract(parsed);
                    }
                } catch {
                    /* fall through */
                }
            }
        }
        return null;
    }

    static async generateCodeFixes(
        issues: AccessibilityIssueDTO[]
    ): Promise<
        Array<{
            issue: AccessibilityIssueDTO;
            fixCode: string;
            explanation: string;
            wcagCriterion?: string;
            impactSummary?: string;
            effortLevel?: string;
            testingTip?: string;
        }>
    > {
        if (!issues || !Array.isArray(issues) || issues.length === 0) {
            return [];
        }
        const fixes = [];

        for (const issue of issues.slice(0, 5)) {
            try {
                const msg = truncateForPrompt(issue.message);
                const sel = truncateForPrompt(issue.selector || "");
                const ctx = truncateForPrompt(issue.context || "");

                const prompt = `You are a web accessibility engineer. Fix the issue below for a developer.

Issue: ${msg}
Selector: ${sel || "N/A"}
Extra context: ${ctx || "N/A"}

Return JSON with these fields:
- "explanation": 2-3 actionable sentences. If axe says contrast/background "could not be determined", explain how to verify via DevTools and how to meet 4.5:1 AA ratio. Do not invent hex colors unless implied.
- "code": Minimal HTML/CSS snippet that directly fixes the issue. Use empty string "" if no code fix applies.
- "wcagCriterion": The WCAG 2.1 criterion violated, e.g. "1.3.1 Info and Relationships (Level A)". Empty string if not applicable.
- "impactSummary": One sentence on who is affected and how, e.g. "Screen reader users cannot identify this input field."
- "effortLevel": "Low" (< 5 min), "Medium" (< 30 min), or "High" (> 30 min).
- "testingTip": One sentence on how to verify the fix, e.g. "Tab to the field with NVDA active and confirm the label is announced."

Be concise and developer-focused.`;

                let response = "";
                let parsed = null;

                try {
                    response = await this.callGeminiAPI(prompt, "AI_API_KEY_CODE_FIX", {
                        temperature: 0.2,
                        maxOutputTokens: 2048,
                        responseMimeType: "application/json",
                        responseSchema: CODE_FIX_RESPONSE_SCHEMA,
                    });
                    parsed = this.parseCodeFixJson(response);
                } catch (err) {
                    console.warn(
                        "Structured code-fix generation failed, retrying without JSON schema:",
                        err
                    );
                }

                if (!parsed) {
                    response = await this.callGeminiAPI(prompt, "AI_API_KEY_CODE_FIX", {
                        temperature: 0.2,
                        maxOutputTokens: 2048,
                    });
                    parsed = this.parseCodeFixJson(response);
                }

                if (parsed) {
                    fixes.push({
                        issue,
                        fixCode: parsed.code.trim() || "—",
                        explanation: parsed.explanation,
                        wcagCriterion: parsed.wcagCriterion,
                        impactSummary: parsed.impactSummary,
                        effortLevel: parsed.effortLevel,
                        testingTip: parsed.testingTip,
                    });
                } else {
                    console.warn(
                        "Failed to parse AI response for issue:",
                        truncateForPrompt(issue.message, 120),
                        "Response preview:",
                        response.slice(0, 200)
                    );
                    fixes.push({
                        issue,
                        fixCode: "—",
                        explanation:
                            response.slice(0, 1200).trim() ||
                            "Could not produce a structured fix; review the issue in the accessibility panel and adjust markup or styles manually.",
                    });
                }
            } catch (error) {
                console.error("Failed to generate fix for issue:", issue.message, error);
            }
        }

        return fixes;
    }

    static async generateRecommendations(
        issues: AccessibilityIssueDTO[]
    ): Promise<string> {
        if (!issues || !Array.isArray(issues) || issues.length === 0) {
            throw new Error("No accessibility issues provided.");
        }

        const formattedIssues = issues
            .map((issue: any, index: number) => {
                return `${index + 1}. [${issue.type || "Unknown"}] ${issue.message || issue.description || "No description"}${issue.selector ? ` (Selector: ${issue.selector})` : ""}`;
            })
            .join("\n");

        const prompt = `You are a senior web accessibility engineer writing a developer-facing audit report.

DETECTED ISSUES (${issues.length} total):
${formattedIssues}

Write a structured report using these exact markdown section headings in order:

## 🔴 Critical & High Priority Fixes
For each critical/high issue: state the WCAG criterion, explain who is affected, and give a concrete 1-2 sentence fix.

## 🟡 Medium Priority Fixes
For each medium issue: same format — WCAG criterion, user impact, concrete fix.

## 🟢 Low Priority & Best Practices
Any low-severity issues or proactive improvements.

## 🛠️ Quick Wins
List the 2-3 fastest fixes a developer can apply in under 5 minutes.

## ✅ How to Test
List 3-5 specific testing steps for the issues above (e.g. axe DevTools, NVDA + Chrome, keyboard-only navigation, colour contrast checker).

## 📚 Resources
Provide 3-5 relevant links to MDN, WCAG docs, or accessibility tools.

Formatting rules:
- Use **bold** for key terms and WCAG criteria
- Use \`code\` for HTML attributes, element names, and selectors
- Be concise and practical — assume a mid-level React/HTML developer
- Skip sections that have no relevant issues rather than leaving them empty`;

        try {
            const text = await this.callGeminiAPI(prompt, "AI_API_KEY_RECC", {
                temperature: 0.5,
                maxOutputTokens: 8192,
            });

            if (!text || text.trim().length === 0) {
                throw new Error("AI returned empty recommendations");
            }

            return text;
        } catch (error: any) {
            console.error(
                "Error generating AI recommendations:",
                error?.message || error
            );

            if (error?.message?.includes("fetch")) {
                throw new Error(
                    "Failed to connect to AI service. Please check your internet connection."
                );
            }

            throw error instanceof Error
                ? error
                : new Error("Failed to generate AI recommendations");
        }
    }
    /** Shared Gemini caller — model stays gemini-2.5-flash. */
    public static async callGeminiAPI(
        input: string | { role: string; parts: { text: string }[] }[],
        apiKeyEnv: string,
        options?: GeminiCallOptions
    ): Promise<string> {
        const apiKey = process.env[apiKeyEnv];
        if (!apiKey) throw new Error(`Missing ${apiKeyEnv} environment variable`);

        const contents = typeof input === "string"
            ? [{ role: "user", parts: [{ text: input }] }]
            : input;

        const generationConfig: Record<string, unknown> = {
            temperature: options?.temperature ?? 0.3,
            maxOutputTokens: options?.maxOutputTokens ?? 1024,
        };
        if (options?.responseMimeType) {
            generationConfig.responseMimeType = options.responseMimeType;
        }
        if (options?.responseSchema) {
            generationConfig.responseSchema = options.responseSchema;
        }

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig,
                }),
            }
        );

        if (!response.ok) {
            const errorData = (await response.json().catch(() => ({}))) as {
                error?: { message?: string };
            };
            const msg = errorData?.error?.message || response.statusText;

            if (response.status === 429) {
                throw new Error(
                    "Rate limit exceeded. Please try again in a few minutes."
                );
            }
            if (response.status === 503) {
                throw new Error(
                    "AI service is temporarily overloaded. Please try again in a few minutes."
                );
            }
            if (response.status === 403 || response.status === 401) {
                throw new Error(
                    `Invalid API key. Please check your ${apiKeyEnv} configuration.`
                );
            }

            throw new Error(`Gemini API error: ${response.status} - ${msg}`);
        }

        const data = (await response.json()) as {
            candidates?: { content?: { parts?: { text?: string }[] } }[];
        };
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
}