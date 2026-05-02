import { useState, useEffect } from 'react';
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
  Wrench,
  Copy,
  Check,
  Clock,
  FlaskConical,
} from 'lucide-react';

interface CodeFix {
  issue: AccessibilityIssue;
  fixCode: string;
  explanation: string;
  wcagCriterion?: string;
  impactSummary?: string;
  effortLevel?: string;
  testingTip?: string;
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

// small helpers 

function getSeverityColor(type: string) {
  switch (type?.toLowerCase()) {
    case 'critical': return 'text-red-600 bg-red-50 border-red-200';
    case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
    case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
    default: return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}

function getSeverityIcon(type: string) {
  switch (type?.toLowerCase()) {
    case 'low': return <CheckCircle2 className="w-4 h-4" />;
    default: return <AlertCircle className="w-4 h-4" />;
  }
}

function getEffortBadge(level?: string) {
  switch (level?.toLowerCase()) {
    case 'low': return 'bg-green-100 text-green-700 border-green-200';
    case 'medium': return 'bg-amber-100  text-amber-700  border-amber-200';
    case 'high': return 'bg-red-100   text-red-700   border-red-200';
    default: return 'bg-gray-100  text-gray-600  border-gray-200';
  }
}

//  copy button 

function CopyButton({ text, label = 'Copy' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 transition-colors"
    >
      {copied
        ? <><Check className="w-3 h-3 text-green-600" /><span className="text-green-600">Copied!</span></>
        : <><Copy className="w-3 h-3" />{label}</>
      }
    </button>
  );
}

//  loading skeleton

function FixSkeleton() {
  return (
    <div className="border border-gray-200 rounded-xl p-5 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-5 w-16 bg-gray-200 rounded-full" />
        <div className="h-5 w-32 bg-gray-200 rounded-full" />
        <div className="h-5 w-14 bg-gray-200 rounded-full ml-auto" />
      </div>
      <div className="h-4 w-3/4 bg-gray-200 rounded" />
      <div className="h-3 w-full bg-gray-100 rounded" />
      <div className="h-3 w-5/6 bg-gray-100 rounded" />
      <div className="h-20 bg-gray-900 rounded-lg opacity-10" />
    </div>
  );
}

// main component 

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
  const [recommendationsGeneratedAt, setRecommendationsGeneratedAt] = useState<Date | null>(null);

  const hasIssues = (accessibilityIssues?.length || 0) > 0;

  const generateCodeFixes = async () => {
    if (!accessibilityIssues || accessibilityIssues.length === 0) return;
    setLoadingFixes(true);
    setActiveTab('fixes');
    try {
      const startTime = Date.now();
      const result = await utilityService.generateCodeFixes(accessibilityIssues);
      setAnalysisTime(Date.now() - startTime);
      setCodeFixes(result.codeFixes || []);
    } catch (error) {
      console.error('Failed to generate code fixes:', error);
    } finally {
      setLoadingFixes(false);
    }
  };

  const handleGenerateRecommendations = () => {
    setRecommendationsGeneratedAt(null);
    onGenerateRecommendations();
    setActiveTab('recommendations');
  };

  // track when AI recommendations arrive
  useEffect(() => {
    if (aiRecommendations) {
      setRecommendationsGeneratedAt(new Date());
    }
  }, [aiRecommendations]);

  return (
    <div className="space-y-6">

      {/* ── Header  */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-green-500" />
            Accessibility Analysis
          </h2>
          <p className="text-gray-500 text-sm mt-1">
            Axe-core powered analysis with AI-generated solutions
          </p>
        </div>

        {hasIssues && (
          <div className="flex items-center gap-3 flex-shrink-0">
            <button
              onClick={generateCodeFixes}
              disabled={loadingFixes}
              className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm"
            >
              {loadingFixes
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating Fixes...</>
                : <><Code2 className="w-4 h-4" />Generate Code Fixes</>
              }
            </button>

            <button
              onClick={handleGenerateRecommendations}
              disabled={loadingAi}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors text-sm"
            >
              {loadingAi
                ? <><RefreshCw className="w-4 h-4 animate-spin" />Generating...</>
                : <><Sparkles className="w-4 h-4" />Generate AI Recommendations</>
              }
            </button>
          </div>
        )}
      </div>

      {/* ── Performance indicator  */}
      {analysisTime > 0 && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
          <Zap className="w-4 h-4 flex-shrink-0" />
          Code fixes generated in <strong>{analysisTime}ms</strong> via axe-core + AI hybrid analysis
        </div>
      )}

      {/* ── Tab navigation  */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          {([
            { key: 'issues', icon: <Bug className="w-4 h-4" />, label: `Issues (${accessibilityIssues?.length || 0})` },
            { key: 'fixes', icon: <Wrench className="w-4 h-4" />, label: `Code Fixes (${codeFixes.length})` },
            { key: 'recommendations', icon: <Sparkles className="w-4 h-4" />, label: 'AI Recommendations' },
          ] as const).map(({ key, icon, label }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors flex items-center gap-2 ${activeTab === key
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {icon}{label}
            </button>
          ))}
        </nav>
      </div>

      {/* ── Tab content  */}
      <div className="min-h-[400px]">

        {/* ISSUES TAB */}
        {activeTab === 'issues' && (
          <div className="space-y-4">
            {hasIssues ? (
              <>
                {/* Severity summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  {(['critical', 'high', 'medium', 'low'] as const).map((level) => {
                    const colors: Record<string, string> = {
                      critical: 'bg-red-50 border-red-200 text-red-600',
                      high: 'bg-orange-50 border-orange-200 text-orange-600',
                      medium: 'bg-yellow-50 border-yellow-200 text-yellow-600',
                      low: 'bg-blue-50 border-blue-200 text-blue-600',
                    };
                    const boldColors: Record<string, string> = {
                      critical: 'text-red-700',
                      high: 'text-orange-700',
                      medium: 'text-yellow-700',
                      low: 'text-blue-700',
                    };
                    return (
                      <div key={level} className={`border rounded-lg p-4 ${colors[level]}`}>
                        <div className="font-medium text-sm capitalize">{level}</div>
                        <div className={`text-2xl font-bold ${boldColors[level]}`}>
                          {accessibilityIssues?.filter(i => i.type?.toLowerCase() === level).length || 0}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Issue list */}
                <div className="space-y-3">
                  {accessibilityIssues?.map((issue, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getSeverityColor(issue.type || '')}`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-0.5">{getSeverityIcon(issue.type || '')}</div>
                        <div className="flex-1 min-w-0">
                          <span className="font-semibold text-sm uppercase tracking-wide">
                            {issue.type || 'Unknown'}
                          </span>
                          <p className="text-gray-900 mt-1 mb-2">
                            {issue.message || issue.description || 'Unknown issue'}
                          </p>
                          {issue.selector && (
                            <code className="text-xs bg-white/70 border border-current/20 px-2 py-0.5 rounded font-mono">
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
              <div className="text-center py-16">
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Accessibility Issues Found</h3>
                <p className="text-gray-500">Great! This website appears to be fully accessible.</p>
              </div>
            )}
          </div>
        )}

        {/* CODE FIXES TAB */}
        {activeTab === 'fixes' && (
          <div className="space-y-5">
            {loadingFixes ? (
              // skeleton cards while loading
              <>{Array.from({ length: 3 }).map((_, i) => <FixSkeleton key={i} />)}</>
            ) : codeFixes.length > 0 ? (
              codeFixes.map((fix, index) => (
                <div key={index} className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">

                  {/* card header */}
                  <div className="flex items-center gap-3 px-5 py-3 bg-gray-50 border-b border-gray-200 flex-wrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getSeverityColor(fix.issue.type || '')}`}>
                      {getSeverityIcon(fix.issue.type || '')}
                      {fix.issue.type || 'Unknown'}
                    </span>
                    {fix.wcagCriterion && (
                      <span className="text-xs text-gray-500 font-mono">
                        WCAG {fix.wcagCriterion}
                      </span>
                    )}
                    {fix.effortLevel && (
                      <span className={`ml-auto inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${getEffortBadge(fix.effortLevel)}`}>
                        <Clock className="w-3 h-3" />
                        {fix.effortLevel} effort
                      </span>
                    )}
                  </div>

                  {/* problem */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-sm text-gray-800 font-medium">
                      {fix.issue.message || fix.issue.description}
                    </p>
                  </div>

                  {/* impact */}
                  {fix.impactSummary && (
                    <div className="px-5 py-3 bg-blue-50 border-b border-blue-100 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-blue-800">{fix.impactSummary}</p>
                    </div>
                  )}

                  {/* solution */}
                  <div className="px-5 py-4 border-b border-gray-100">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      💡 Solution
                    </p>
                    <p className="text-sm text-gray-700 leading-relaxed">{fix.explanation}</p>
                  </div>

                  {/* code fix */}
                  {fix.fixCode && fix.fixCode !== '—' && (
                    <div className="px-5 py-4 border-b border-gray-100">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                          📝 Code Fix
                        </p>
                        <CopyButton text={fix.fixCode} />
                      </div>
                      <pre className="bg-gray-900 text-green-300 text-xs leading-relaxed p-4 rounded-lg overflow-x-auto max-h-64 font-mono whitespace-pre-wrap break-words">
                        {fix.fixCode}
                      </pre>
                    </div>
                  )}

                  {/* testing tip */}
                  {fix.testingTip && (
                    <div className="px-5 py-3 bg-teal-50 flex items-start gap-2">
                      <FlaskConical className="w-4 h-4 text-teal-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-teal-800">
                        <strong>Test: </strong>{fix.testingTip}
                      </p>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <Code2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Code Fixes Generated</h3>
                <p className="text-gray-500 mb-5">
                  {hasIssues
                    ? 'Click "Generate Code Fixes" to get AI-powered solutions.'
                    : 'No accessibility issues found — no fixes needed!'}
                </p>
                {hasIssues && (
                  <button
                    onClick={generateCodeFixes}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center gap-2 mx-auto transition-colors text-sm"
                  >
                    <Code2 className="w-4 h-4" />Generate Code Fixes
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* RECOMMENDATIONS TAB */}
        {activeTab === 'recommendations' && (
          <div>
            {aiRecommendations ? (
              <div className="border border-purple-200 rounded-xl overflow-hidden">

                {/* recommendations header */}
                <div className="flex items-center justify-between px-5 py-3 bg-purple-50 border-b border-purple-200 flex-wrap gap-2">
                  <h3 className="text-sm font-semibold text-purple-800 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    AI Recommendations
                  </h3>
                  <div className="flex items-center gap-3">
                    {recommendationsGeneratedAt && (
                      <span className="text-xs text-purple-500 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        Generated at {recommendationsGeneratedAt.toLocaleTimeString()}
                      </span>
                    )}
                    <CopyButton text={aiRecommendations} label="Copy All" />
                    <button
                      onClick={handleGenerateRecommendations}
                      disabled={loadingAi}
                      className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md border border-purple-300 bg-white hover:bg-purple-50 text-purple-700 transition-colors disabled:opacity-50"
                    >
                      <RefreshCw className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                </div>

                {/* rendered markdown */}
                <div className="px-6 py-5">
                  <AiResponseRenderer text={aiRecommendations} />
                </div>
              </div>
            ) : isErrorAi ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-red-800 mb-2">AI Error</h3>
                <p className="text-red-600 mb-4 text-sm">
                  {aiError?.message || 'Failed to generate AI recommendations.'}
                </p>
                <button
                  onClick={onRetryAI}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2 text-sm"
                >
                  <RefreshCw className="w-4 h-4" />Try Again
                </button>
              </div>
            ) : loadingAi ? (
              // loading skeleton for recommendations
              <div className="border border-purple-200 rounded-xl overflow-hidden animate-pulse">
                <div className="px-5 py-3 bg-purple-50 border-b border-purple-200">
                  <div className="h-4 w-40 bg-purple-200 rounded" />
                </div>
                <div className="px-6 py-5 space-y-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className={`h-3 bg-gray-200 rounded ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="text-center py-16">
                <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No AI Recommendations Yet</h3>
                <p className="text-gray-500 mb-5">
                  {hasIssues
                    ? 'Generate a structured audit report with WCAG references, quick wins, and testing steps.'
                    : 'No accessibility issues found — no recommendations needed!'}
                </p>
                {hasIssues && (
                  <button
                    onClick={handleGenerateRecommendations}
                    disabled={loadingAi}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2 mx-auto transition-colors text-sm"
                  >
                    <Sparkles className="w-4 h-4" />Generate AI Recommendations
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
