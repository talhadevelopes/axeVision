import { AccessibilityIssueDTO } from "@axeVision/shared";

export class AccessibilityAIRecommendationService {

    static async generateCodeFixes(
        issues: AccessibilityIssueDTO[]
    ): Promise<
        Array<{
            issue: AccessibilityIssueDTO;
            fixCode: string;
            explanation: string;
        }>
    > {
        if (!issues || !Array.isArray(issues) || issues.length === 0) {
            return [];
        }
        const fixes = [];

        for (const issue of issues.slice(0, 5)) {
            // Limit to 5 issues for performance
            try {
                const prompt = `You are an expert web developer. Generate a specific code fix for this accessibility issue.

Issue: ${issue.message}
Selector: ${issue.selector || "N/A"}
Context: ${issue.context || "N/A"}

Respond ONLY with valid JSON in this exact format:
{
  "code": "exact HTML code fix here",
  "explanation": "brief explanation in 1-2 sentences"
}

Examples:
- For missing alt: {"code": "<img src='image.jpg' alt='Descriptive text'>", "explanation": "Add descriptive alt text to make images accessible to screen readers."}
- For empty button: {"code": "<button>Submit Form</button>", "explanation": "Add descriptive text content to make button purpose clear."}
- For missing lang: {"code": "<html lang='en'>", "explanation": "Add language attribute to help screen readers pronounce content correctly."}

Respond with JSON only, no other text:`;

                const response = await this.callGeminiAPI(
                    prompt,
                    "AI_API_KEY_CODE_FIX"
                );

                try {
                    // Clean up the response - remove markdown code blocks and extra text
                    let cleanResponse = response.trim();

                    // Remove markdown code blocks
                    cleanResponse = cleanResponse
                        .replace(/```json\n?/g, "")
                        .replace(/```\n?/g, "");

                    // Try to extract JSON from the response
                    const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        cleanResponse = jsonMatch[0];
                    }

                    const parsed = JSON.parse(cleanResponse);
                    fixes.push({
                        issue,
                        fixCode: parsed.code || "No code provided",
                        explanation: parsed.explanation || "No explanation provided",
                    });
                } catch (e) {
                    console.warn(
                        "Failed to parse AI response for issue:",
                        issue.message,
                        "Response:",
                        response
                    );

                    // Better fallback - try to extract useful information
                    let fallbackCode = "No specific code provided";
                    let fallbackExplanation = "AI provided general guidance";

                    // Try to extract some useful content even if JSON parsing fails
                    if (response.includes("alt=")) {
                        fallbackCode = '<img src="..." alt="Descriptive text here">';
                        fallbackExplanation = "Add descriptive alt text to images";
                    } else if (response.includes("lang=")) {
                        fallbackCode = '<html lang="en">';
                        fallbackExplanation = "Add language attribute to HTML element";
                    } else if (response.includes("button") && response.includes("text")) {
                        fallbackCode = "<button>Descriptive button text</button>";
                        fallbackExplanation = "Add descriptive text content to buttons";
                    } else if (response.includes("label")) {
                        fallbackCode =
                            '<label for="input-id">Label text</label><input id="input-id" type="text">';
                        fallbackExplanation = "Associate labels with form inputs";
                    } else if (response.includes("main")) {
                        fallbackCode = "<main><!-- Main content here --></main>";
                        fallbackExplanation = "Wrap main content in a <main> landmark";
                    }

                    fixes.push({
                        issue,
                        fixCode: fallbackCode,
                        explanation: fallbackExplanation,
                    });
                }
            } catch (error) {
                console.error("Failed to generate fix for issue:", issue.message);
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
                return `${index + 1}. Type: ${issue.type || "Unknown"}, Message: ${issue.message || issue.description || "No description"}${issue.selector ? `, Selector: ${issue.selector}` : ""}`;
            })
            .join("\n");

        const prompt = `You are an expert in web accessibility. I have identified the following accessibility issues on a webpage:\n\n${formattedIssues}\n\nPlease provide concise, actionable recommendations to fix these issues. Focus on practical steps a developer can take. Group recommendations by issue type if possible.`;

        try {
            const recKey = process.env.AI_API_KEY_RECC;
            if (!recKey) {
                throw new Error("Missing AI_API_KEY_RECC environment variable");
            }

            // Direct API call to Google Gemini
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${recKey}`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                parts: [
                                    {
                                        text: prompt,
                                    },
                                ],
                            },
                        ],
                        generationConfig: {
                            temperature: 0.5,
                            maxOutputTokens: 1000000,
                        },
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                console.error("Gemini API error response:", errorData);

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
                        "Invalid API key. Please check your AI_API_KEY_RECC configuration."
                    );
                }

                throw new Error(
                    `Gemini API error: ${response.status} - ${errorData?.error?.message || response.statusText}`
                );
            }

            const data = await response.json();
            const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!text || text.trim().length === 0) {
                console.error("Empty response from Gemini:", data);
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

    /**
     * Helper method to call Gemini API
     */

    public static async callGeminiAPI(
        input: string | { role: string; parts: { text: string }[] }[],
        apiKeyEnv: string
    ): Promise<string> {
        const apiKey = process.env[apiKeyEnv];
        if (!apiKey) throw new Error(`Missing ${apiKeyEnv} environment variable`);

        const contents = typeof input === "string"
            ? [{ parts: [{ text: input }] }]
            : input;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents,
                    generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
                }),
            }
        );

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    }
}