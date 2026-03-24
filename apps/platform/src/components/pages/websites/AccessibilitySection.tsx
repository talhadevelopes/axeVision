import type { AccessibilityIssue } from "@axeVision/shared";
import AiResponseRenderer from "../../shared/AiResponseRenderer";

interface AccessibilitySectionProps {
  accessibilityIssues: AccessibilityIssue[] | undefined;
  aiRecommendations: string | undefined;
  loadingAi: boolean;
  isErrorAi: boolean;
  aiError: Error | null;
  onGenerateRecommendations: () => void;
  onRetryAI: () => void;
}

export default function AccessibilitySection({
  accessibilityIssues,
  aiRecommendations,
  loadingAi,
  isErrorAi,
  aiError,
  onGenerateRecommendations,
  onRetryAI,
}: AccessibilitySectionProps) {
  const hasIssues = (accessibilityIssues?.length || 0) > 0;

  return (
    <div>
      <h2 className="text-xl mb-2 flex items-center justify-between">
        Accessibility Issues
        {hasIssues && (
          <button
            onClick={onGenerateRecommendations}
            disabled={loadingAi}
            className="ml-4 px-3 py-1 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {loadingAi ? (
              <>
                <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 mr-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4.227 4.227l-.707.707M1.636 17.364l.707-.707M12 21v-1m-6.364-1.636l.707-.707M3 12H2"
                  ></path>
                </svg>
                Generate AI Recommendations
              </>
            )}
          </button>
        )}
      </h2>

      {hasIssues ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-4">
          <ul className="list-disc pl-6">
            {accessibilityIssues?.map((issue, index) => (
              <li key={index} className="mb-2">
                <span className="font-medium">
                  {issue.message || issue.description || "Unknown issue"}
                </span>
                <span className="text-gray-600">
                  {" "}
                  ({issue.type || "Unknown"})
                </span>
                {issue.selector && (
                  <code className="text-xs bg-gray-100 px-1 rounded ml-2">
                    {issue.selector}
                  </code>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <p className="text-green-600 mb-4">✅ No accessibility issues found</p>
      )}

      {/* AI Recommendations Section */}
      {aiRecommendations && (
        <div className="bg-blue-50 border border-blue-200 rounded p-4 mt-4 mb-4">
          <h3 className="text-lg font-semibold mb-2">AI Recommendations</h3>
          <div className="max-w-none">
            <AiResponseRenderer text={aiRecommendations} />
          </div>
        </div>
      )}

      {isErrorAi && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-500 font-semibold">AI Error:</p>
          <p className="text-red-600">
            {aiError?.message || "Failed to generate AI recommendations."}
          </p>
          <button
            onClick={onRetryAI}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            🔄 Try Again
          </button>
        </div>
      )}
    </div>
  );
}
