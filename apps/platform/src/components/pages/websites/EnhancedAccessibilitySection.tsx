import { useState } from 'react';
import { utilityService } from '../../../services/api';
import type { AccessibilityIssue } from "@axeVision/shared";
import AiResponseRenderer from "../../shared/AiResponseRenderer";
import { 
  AlertCircle, 
  CheckCircle2, 
  Code2, 
  Sparkles, 
  Zap, 
  RefreshCw,
  Bug,
  Wrench
} from 'lucide-react';


interface CodeFix {
  issue: AccessibilityIssue;
  fixCode: string;
  explanation: string;
}

interface EnhancedAccessibilitySectionProps {
  accessibilityIssues: AccessibilityIssue[] | undefined;
  aiRecommendations: string | undefined;
  loadingAi: boolean;
  isErrorAi: boolean;
  aiError: Error | null;
  onGenerateRecommendations: () => void;
  onRetryAI: () => void;
  websiteId: string;
}

export default function EnhancedAccessibilitySection({
  accessibilityIssues,
  aiRecommendations,
  loadingAi,
  isErrorAi,
  aiError,
  onGenerateRecommendations,
  onRetryAI,
}: EnhancedAccessibilitySectionProps) {
  const [codeFixes, setCodeFixes] = useState<CodeFix[]>([]);
  const [loadingFixes, setLoadingFixes] = useState(false);
  const [activeTab, setActiveTab] = useState<'issues' | 'fixes' | 'recommendations'>('issues');
  const [analysisTime, setAnalysisTime] = useState<number>(0);

  const hasIssues = (accessibilityIssues?.length || 0) > 0;

  const generateCodeFixes = async () => {
    if (!accessibilityIssues || accessibilityIssues.length === 0) return;
    
    setLoadingFixes(true);
    try {
      const startTime = Date.now();
      const result = await utilityService.generateCodeFixes(accessibilityIssues);
      const endTime = Date.now();
      setAnalysisTime(endTime - startTime);
      setCodeFixes(result.codeFixes || []);
    } catch (error) {
      console.error('Failed to generate code fixes:', error);
    } finally {
      setLoadingFixes(false);
    }
  };

  const getSeverityColor = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getSeverityIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'critical': return <AlertCircle className="w-4 h-4" />;
      case 'high': return <AlertCircle className="w-4 h-4" />;
      case 'medium': return <AlertCircle className="w-4 h-4" />;
      case 'low': return <CheckCircle2 className="w-4 h-4" />;
      default: return <Bug className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-500" />
            Accessibility Analysis
          </h2>
          <p className="text-gray-600 mt-1">
            Axe-core powered analysis with AI-generated solutions
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {hasIssues && (
            <>
              <button
                onClick={generateCodeFixes}
                disabled={loadingFixes}
                className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {loadingFixes ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating Fixes...
                  </>
                ) : (
                  <>
                    <Code2 className="w-4 h-4" />
                    Generate Code Fixes
                  </>
                )}
              </button>
              
              <button
                onClick={onGenerateRecommendations}
                disabled={loadingAi}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
              >
                {loadingAi ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate AI Recommendations
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Performance Indicator */}
      {analysisTime > 0 && (
        <div className="text-sm text-gray-600 bg-green-50 border border-green-200 rounded-lg p-3">
          ⚡ Code fixes generated in {analysisTime}ms using axe-core + AI hybrid analysis
        </div>
      )}

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('issues')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'issues'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Issues ({accessibilityIssues?.length || 0})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('fixes')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'fixes'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Wrench className="w-4 h-4" />
              Code Fixes ({codeFixes.length})
            </div>
          </button>
          
          <button
            onClick={() => setActiveTab('recommendations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'recommendations'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              AI Recommendations
            </div>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {hasIssues ? (
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-600 font-medium text-sm">Critical</div>
                    <div className="text-2xl font-bold text-red-700">
                      {accessibilityIssues?.filter(i => i.type?.toLowerCase() === 'critical').length || 0}
                    </div>
                  </div>
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="text-orange-600 font-medium text-sm">High</div>
                    <div className="text-2xl font-bold text-orange-700">
                      {accessibilityIssues?.filter(i => i.type?.toLowerCase() === 'high').length || 0}
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-600 font-medium text-sm">Medium</div>
                    <div className="text-2xl font-bold text-yellow-700">
                      {accessibilityIssues?.filter(i => i.type?.toLowerCase() === 'medium').length || 0}
                    </div>
                  </div>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="text-blue-600 font-medium text-sm">Low</div>
                    <div className="text-2xl font-bold text-blue-700">
                      {accessibilityIssues?.filter(i => i.type?.toLowerCase() === 'low').length || 0}
                    </div>
                  </div>
                </div>

                {/* Issues List */}
                <div className="space-y-3">
                  {accessibilityIssues?.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getSeverityColor(issue.type || '')}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">
                          {getSeverityIcon(issue.type || '')}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-sm uppercase tracking-wide">
                              {issue.type || 'Unknown'}
                            </span>
                          </div>
                          <p className="text-gray-900 mb-2">
                            {issue.message || issue.description || "Unknown issue"}
                          </p>
                          {issue.selector && (
                            <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                              {issue.selector}
                            </code>
                          )}
                          {issue.context && (
                            <p className="text-xs text-gray-600 mt-2">
                              <strong>Context:</strong> {issue.context}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Accessibility Issues Found</h3>
                <p className="text-gray-600">Great! This website appears to be accessible.</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'fixes' && (
          <div className="space-y-4">
            {codeFixes.length > 0 ? (
              codeFixes.map((fix, index) => (
                <div key={index} className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-green-600 font-bold text-sm">{index + 1}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium text-green-800 mb-2">
                        Fix for: {fix.issue.type} Issue
                      </h4>
                      <p className="text-sm text-gray-700 mb-3">
                        <strong>Problem:</strong> {fix.issue.message || fix.issue.description}
                      </p>
                      
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 mb-1">💡 Solution:</p>
                        <p className="text-sm text-gray-600">{fix.explanation}</p>
                      </div>
                      
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">📝 Code Fix:</p>
                        <div className="bg-gray-900 border border-gray-700 rounded-lg shadow-inner">
                          <pre className="text-green-300 text-sm leading-relaxed p-4 whitespace-pre-wrap break-words overflow-y-auto max-h-64">
                            {fix.fixCode}
                          </pre>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-12">
                <Code2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Code Fixes Generated</h3>
                <p className="text-gray-600 mb-4">
                  {hasIssues 
                    ? 'Click "Generate Code Fixes" to get AI-powered solutions for accessibility issues.'
                    : 'No accessibility issues found, so no fixes are needed!'
                  }
                </p>
                {hasIssues && (
                  <button
                    onClick={generateCodeFixes}
                    disabled={loadingFixes}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    <Code2 className="w-4 h-4" />
                    Generate Code Fixes
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'recommendations' && (
          <div>
            {aiRecommendations ? (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Recommendations
                </h3>
                <div className="prose max-w-none">
                  <AiResponseRenderer text={aiRecommendations} />
                </div>
              </div>
            ) : isErrorAi ? (
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">AI Error</h3>
                <p className="text-red-600 mb-4">
                  {aiError?.message || "Failed to generate AI recommendations."}
                </p>
                <button
                  onClick={onRetryAI}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again
                </button>
              </div>
            ) : (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No AI Recommendations Yet</h3>
                <p className="text-gray-600 mb-4">
                  {hasIssues 
                    ? 'Generate AI-powered recommendations to get detailed guidance on fixing accessibility issues.'
                    : 'No accessibility issues found, so no recommendations are needed!'
                  }
                </p>
                {hasIssues && (
                  <button
                    onClick={onGenerateRecommendations}
                    disabled={loadingAi}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate AI Recommendations
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
