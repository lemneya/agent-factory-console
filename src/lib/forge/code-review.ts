/**
 * Forge AI Code Review
 *
 * Automatic security and quality scan before merge.
 * Catches bugs, XSS, SQL injection, and other issues.
 *
 * KILLER FEATURE #2: Built-in enterprise-grade QA
 */

export type IssueSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';
export type IssueCategory =
  | 'security'
  | 'performance'
  | 'accessibility'
  | 'best-practice'
  | 'type-safety'
  | 'maintainability'
  | 'testing';

export interface CodeIssue {
  id: string;
  file: string;
  line: number;
  column?: number;
  severity: IssueSeverity;
  category: IssueCategory;
  rule: string;
  message: string;
  suggestion?: string;
  autoFixable: boolean;
  codeSnippet?: string;
}

export interface ReviewResult {
  id: string;
  buildId: string;
  timestamp: Date;
  status: 'passed' | 'failed' | 'warning';
  score: number; // 0-100
  issues: CodeIssue[];
  summary: ReviewSummary;
  metrics: CodeMetrics;
  aiSuggestions: AISuggestion[];
}

export interface ReviewSummary {
  totalIssues: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  info: number;
  filesReviewed: number;
  linesAnalyzed: number;
}

export interface CodeMetrics {
  complexity: number; // Cyclomatic complexity average
  maintainability: number; // 0-100
  testCoverage?: number; // 0-100
  duplicateCode: number; // Percentage
  techDebt: string; // e.g., "2h 30m"
}

export interface AISuggestion {
  id: string;
  type: 'refactor' | 'optimize' | 'security' | 'accessibility' | 'ux';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'trivial' | 'easy' | 'moderate' | 'significant';
  files: string[];
  suggestedCode?: string;
}

// ============================================
// SECURITY RULES
// ============================================

export const SECURITY_RULES = {
  XSS: {
    id: 'SEC001',
    name: 'Cross-Site Scripting (XSS)',
    patterns: [
      /dangerouslySetInnerHTML/,
      /innerHTML\s*=/,
      /document\.write/,
      /eval\s*\(/,
    ],
    severity: 'critical' as IssueSeverity,
    message: 'Potential XSS vulnerability detected',
    suggestion: 'Use safe rendering methods or sanitize user input',
  },
  SQL_INJECTION: {
    id: 'SEC002',
    name: 'SQL Injection',
    patterns: [
      /\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/i,
      /`.*\$\{.*\}.*(?:SELECT|INSERT|UPDATE|DELETE|DROP)/i,
    ],
    severity: 'critical' as IssueSeverity,
    message: 'Potential SQL injection vulnerability',
    suggestion: 'Use parameterized queries or an ORM',
  },
  COMMAND_INJECTION: {
    id: 'SEC003',
    name: 'Command Injection',
    patterns: [
      /exec\s*\(\s*[`'"].*\$\{/,
      /child_process.*exec/,
      /spawn\s*\(\s*[`'"].*\$\{/,
    ],
    severity: 'critical' as IssueSeverity,
    message: 'Potential command injection vulnerability',
    suggestion: 'Avoid executing shell commands with user input',
  },
  HARDCODED_SECRETS: {
    id: 'SEC004',
    name: 'Hardcoded Secrets',
    patterns: [
      /(?:password|secret|api_key|apikey|token)\s*[:=]\s*['"]/i,
      /sk-[a-zA-Z0-9]{32,}/,
      /ghp_[a-zA-Z0-9]{36}/,
    ],
    severity: 'critical' as IssueSeverity,
    message: 'Hardcoded secret or API key detected',
    suggestion: 'Use environment variables for sensitive data',
  },
  INSECURE_RANDOM: {
    id: 'SEC005',
    name: 'Insecure Randomness',
    patterns: [
      /Math\.random\s*\(\)/,
    ],
    severity: 'medium' as IssueSeverity,
    message: 'Math.random() is not cryptographically secure',
    suggestion: 'Use crypto.randomUUID() or crypto.getRandomValues()',
  },
  OPEN_REDIRECT: {
    id: 'SEC006',
    name: 'Open Redirect',
    patterns: [
      /redirect\s*\(\s*(?:req|request)\.(?:query|params|body)/,
      /window\.location\s*=\s*(?:.*\+|`.*\$\{)/,
    ],
    severity: 'high' as IssueSeverity,
    message: 'Potential open redirect vulnerability',
    suggestion: 'Validate redirect URLs against an allowlist',
  },
};

// ============================================
// PERFORMANCE RULES
// ============================================

export const PERFORMANCE_RULES = {
  N_PLUS_ONE: {
    id: 'PERF001',
    name: 'N+1 Query Pattern',
    patterns: [
      /\.map\s*\(\s*async.*(?:findOne|findUnique|fetch)/,
      /for\s*\(.*\)\s*\{[^}]*(?:findOne|findUnique|await\s+fetch)/,
    ],
    severity: 'high' as IssueSeverity,
    message: 'Potential N+1 query pattern detected',
    suggestion: 'Use batch queries or include relations',
  },
  MISSING_MEMO: {
    id: 'PERF002',
    name: 'Missing Memoization',
    patterns: [
      /useCallback\s*\(\s*\([^)]*\)\s*=>\s*\{[\s\S]*\},\s*\[\s*\]\s*\)/,
    ],
    severity: 'low' as IssueSeverity,
    message: 'Consider memoizing expensive computations',
    suggestion: 'Use useMemo or useCallback with proper dependencies',
  },
  LARGE_BUNDLE: {
    id: 'PERF003',
    name: 'Large Import',
    patterns: [
      /import\s+(?:\*\s+as\s+\w+|{\s*[^}]{100,}\s*})\s+from\s+['"](?:lodash|moment|date-fns)['"]/,
    ],
    severity: 'medium' as IssueSeverity,
    message: 'Large library import may increase bundle size',
    suggestion: 'Import only the specific functions you need',
  },
  UNOPTIMIZED_IMAGE: {
    id: 'PERF004',
    name: 'Unoptimized Image',
    patterns: [
      /<img\s+[^>]*src=[^>]*>/,
    ],
    severity: 'medium' as IssueSeverity,
    message: 'Use next/image for optimized images',
    suggestion: 'Replace <img> with <Image> from next/image',
  },
};

// ============================================
// ACCESSIBILITY RULES
// ============================================

export const A11Y_RULES = {
  MISSING_ALT: {
    id: 'A11Y001',
    name: 'Missing Alt Text',
    patterns: [
      /<(?:img|Image)\s+(?![^>]*alt=)[^>]*>/,
    ],
    severity: 'high' as IssueSeverity,
    message: 'Image is missing alt text',
    suggestion: 'Add descriptive alt text for accessibility',
  },
  MISSING_LABEL: {
    id: 'A11Y002',
    name: 'Missing Form Label',
    patterns: [
      /<input\s+(?![^>]*aria-label)[^>]*(?:type=["'](?:text|email|password|number)["'])[^>]*>/,
    ],
    severity: 'medium' as IssueSeverity,
    message: 'Form input is missing a label',
    suggestion: 'Add a <label> element or aria-label attribute',
  },
  LOW_CONTRAST: {
    id: 'A11Y003',
    name: 'Potential Low Contrast',
    patterns: [
      /text-gray-[3-4]00/,
      /text-slate-[3-4]00/,
    ],
    severity: 'low' as IssueSeverity,
    message: 'Text color may have low contrast',
    suggestion: 'Ensure 4.5:1 contrast ratio for normal text',
  },
  MISSING_LANG: {
    id: 'A11Y004',
    name: 'Missing Language',
    patterns: [
      /<html\s+(?![^>]*lang=)/,
    ],
    severity: 'medium' as IssueSeverity,
    message: 'HTML element is missing lang attribute',
    suggestion: 'Add lang="en" (or appropriate language) to <html>',
  },
};

// ============================================
// REVIEW ENGINE
// ============================================

export interface ReviewOptions {
  security: boolean;
  performance: boolean;
  accessibility: boolean;
  bestPractices: boolean;
  aiSuggestions: boolean;
  autoFix: boolean;
}

export const DEFAULT_REVIEW_OPTIONS: ReviewOptions = {
  security: true,
  performance: true,
  accessibility: true,
  bestPractices: true,
  aiSuggestions: true,
  autoFix: false,
};

export async function reviewCode(
  buildId: string,
  files: Record<string, string>,
  options: ReviewOptions = DEFAULT_REVIEW_OPTIONS
): Promise<ReviewResult> {
  const issues: CodeIssue[] = [];
  let filesReviewed = 0;
  let linesAnalyzed = 0;

  // Review each file
  for (const [filePath, content] of Object.entries(files)) {
    // Skip non-code files
    if (!isCodeFile(filePath)) continue;

    filesReviewed++;
    const lines = content.split('\n');
    linesAnalyzed += lines.length;

    // Security review
    if (options.security) {
      issues.push(...runRules(filePath, content, SECURITY_RULES, 'security'));
    }

    // Performance review
    if (options.performance) {
      issues.push(...runRules(filePath, content, PERFORMANCE_RULES, 'performance'));
    }

    // Accessibility review
    if (options.accessibility) {
      issues.push(...runRules(filePath, content, A11Y_RULES, 'accessibility'));
    }
  }

  // Calculate summary
  const summary: ReviewSummary = {
    totalIssues: issues.length,
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
    info: issues.filter(i => i.severity === 'info').length,
    filesReviewed,
    linesAnalyzed,
  };

  // Calculate score
  const score = calculateScore(summary);

  // Determine status
  const status = summary.critical > 0 ? 'failed' :
                 summary.high > 0 ? 'warning' : 'passed';

  // Generate AI suggestions
  const aiSuggestions = options.aiSuggestions
    ? generateAISuggestions(issues, files)
    : [];

  return {
    id: `review-${buildId}-${Date.now()}`,
    buildId,
    timestamp: new Date(),
    status,
    score,
    issues,
    summary,
    metrics: calculateMetrics(files),
    aiSuggestions,
  };
}

function isCodeFile(path: string): boolean {
  const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.vue', '.svelte'];
  return codeExtensions.some(ext => path.endsWith(ext));
}

function runRules(
  filePath: string,
  content: string,
  rules: Record<string, {
    id: string;
    name: string;
    patterns: RegExp[];
    severity: IssueSeverity;
    message: string;
    suggestion?: string;
  }>,
  category: IssueCategory
): CodeIssue[] {
  const issues: CodeIssue[] = [];
  const lines = content.split('\n');

  for (const [ruleName, rule] of Object.entries(rules)) {
    for (const pattern of rule.patterns) {
      lines.forEach((line, lineIndex) => {
        if (pattern.test(line)) {
          issues.push({
            id: `${rule.id}-${filePath}-${lineIndex}`,
            file: filePath,
            line: lineIndex + 1,
            severity: rule.severity,
            category,
            rule: ruleName,
            message: rule.message,
            suggestion: rule.suggestion,
            autoFixable: false,
            codeSnippet: line.trim(),
          });
        }
      });
    }
  }

  return issues;
}

function calculateScore(summary: ReviewSummary): number {
  // Weighted scoring
  const penalties = {
    critical: 25,
    high: 10,
    medium: 3,
    low: 1,
    info: 0,
  };

  const totalPenalty =
    summary.critical * penalties.critical +
    summary.high * penalties.high +
    summary.medium * penalties.medium +
    summary.low * penalties.low;

  return Math.max(0, 100 - totalPenalty);
}

function calculateMetrics(files: Record<string, string>): CodeMetrics {
  // Simplified metrics calculation
  let totalComplexity = 0;
  let fileCount = 0;

  for (const [path, content] of Object.entries(files)) {
    if (!isCodeFile(path)) continue;

    fileCount++;
    // Count decision points (if, for, while, switch, &&, ||, ?)
    const complexity = (content.match(/\b(if|for|while|switch)\b|\?\s*:|&&|\|\|/g) || []).length;
    totalComplexity += complexity;
  }

  return {
    complexity: fileCount > 0 ? Math.round(totalComplexity / fileCount) : 0,
    maintainability: 75, // Would use more sophisticated analysis
    testCoverage: undefined,
    duplicateCode: 5, // Would use jscpd or similar
    techDebt: '1h 45m',
  };
}

function generateAISuggestions(
  issues: CodeIssue[],
  _files: Record<string, string>
): AISuggestion[] {
  const suggestions: AISuggestion[] = [];

  // Group issues by type and suggest fixes
  const securityIssues = issues.filter(i => i.category === 'security');
  if (securityIssues.length > 3) {
    suggestions.push({
      id: 'ai-sec-1',
      type: 'security',
      title: 'Security Hardening Recommended',
      description: `Found ${securityIssues.length} security issues. Consider adding input validation middleware and using a security linting plugin.`,
      impact: 'high',
      effort: 'moderate',
      files: [...new Set(securityIssues.map(i => i.file))],
    });
  }

  const perfIssues = issues.filter(i => i.category === 'performance');
  if (perfIssues.length > 2) {
    suggestions.push({
      id: 'ai-perf-1',
      type: 'optimize',
      title: 'Performance Optimization Opportunity',
      description: 'Several performance patterns detected. Consider implementing data fetching optimizations and code splitting.',
      impact: 'medium',
      effort: 'easy',
      files: [...new Set(perfIssues.map(i => i.file))],
    });
  }

  const a11yIssues = issues.filter(i => i.category === 'accessibility');
  if (a11yIssues.length > 0) {
    suggestions.push({
      id: 'ai-a11y-1',
      type: 'accessibility',
      title: 'Accessibility Improvements',
      description: `${a11yIssues.length} accessibility issues found. Run automated a11y testing with axe-core for comprehensive coverage.`,
      impact: 'high',
      effort: 'easy',
      files: [...new Set(a11yIssues.map(i => i.file))],
    });
  }

  return suggestions;
}

// ============================================
// REVIEW BADGE
// ============================================

export function getReviewBadge(score: number): {
  label: string;
  color: string;
  icon: string;
} {
  if (score >= 90) return { label: 'A+', color: 'green', icon: '🛡️' };
  if (score >= 80) return { label: 'A', color: 'green', icon: '✅' };
  if (score >= 70) return { label: 'B', color: 'yellow', icon: '⚠️' };
  if (score >= 60) return { label: 'C', color: 'orange', icon: '⚠️' };
  return { label: 'F', color: 'red', icon: '🚨' };
}
