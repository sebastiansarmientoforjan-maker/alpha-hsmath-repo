/**
 * Workflow Context Manager
 * Manages state and navigation between workflow steps
 */

export interface WorkflowContext {
  // From Gem Generator
  lastPrompt?: {
    id: string;
    title: string;
    content: string;
    engine: 'gemini' | 'perplexity';
    timestamp: number;
  };

  // Raw Results
  pendingResults?: {
    promptId: string;
    promptTitle: string;
    geminiResults?: string;
    perplexityResults?: string;
    timestamp: number;
  };

  // Processed Investigation
  lastInvestigation?: {
    id: string;
    title: string;
    timestamp: number;
  };

  // Decision Log
  lastDecisionLog?: {
    id: string;
    title: string;
    timestamp: number;
  };

  // Current step
  currentStep?: 'prompt' | 'research' | 'process' | 'investigate' | 'decide' | 'present';
}

const WORKFLOW_KEY = 'alpha-research-workflow';

export class WorkflowManager {
  private static getContext(): WorkflowContext {
    if (typeof window === 'undefined') return {};
    const stored = localStorage.getItem(WORKFLOW_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  private static setContext(context: WorkflowContext) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(WORKFLOW_KEY, JSON.stringify(context));
  }

  // After saving a prompt in Gem Generator
  static setLastPrompt(id: string, title: string, content: string, engine: 'gemini' | 'perplexity') {
    const context = this.getContext();
    context.lastPrompt = { id, title, content, engine, timestamp: Date.now() };
    context.currentStep = 'research';
    this.setContext(context);
  }

  static getLastPrompt() {
    return this.getContext().lastPrompt;
  }

  // When pasting results
  static setPendingResults(promptId: string, promptTitle: string, gemini?: string, perplexity?: string) {
    const context = this.getContext();
    context.pendingResults = {
      promptId,
      promptTitle,
      geminiResults: gemini,
      perplexityResults: perplexity,
      timestamp: Date.now(),
    };
    context.currentStep = 'process';
    this.setContext(context);
  }

  static getPendingResults() {
    return this.getContext().pendingResults;
  }

  static clearPendingResults() {
    const context = this.getContext();
    delete context.pendingResults;
    this.setContext(context);
  }

  // After creating investigation
  static setLastInvestigation(id: string, title: string) {
    const context = this.getContext();
    context.lastInvestigation = { id, title, timestamp: Date.now() };
    context.currentStep = 'investigate';
    this.clearPendingResults();
    this.setContext(context);
  }

  static getLastInvestigation() {
    return this.getContext().lastInvestigation;
  }

  // After creating decision log
  static setLastDecisionLog(id: string, title: string) {
    const context = this.getContext();
    context.lastDecisionLog = { id, title, timestamp: Date.now() };
    context.currentStep = 'decide';
    this.setContext(context);
  }

  static getLastDecisionLog() {
    return this.getContext().lastDecisionLog;
  }

  // Get current step
  static getCurrentStep() {
    return this.getContext().currentStep;
  }

  static setCurrentStep(step: WorkflowContext['currentStep']) {
    const context = this.getContext();
    context.currentStep = step;
    this.setContext(context);
  }

  // Clear all context
  static clearAll() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(WORKFLOW_KEY);
  }

  // Check if there's pending work
  static hasPendingWork(): boolean {
    const context = this.getContext();
    return !!(context.lastPrompt || context.pendingResults);
  }

  // Get next recommended action
  static getNextAction(): { text: string; href: string; description: string } | null {
    const context = this.getContext();

    if (context.pendingResults) {
      return {
        text: 'Process Results with AI',
        href: '/admin/process-results',
        description: 'Mix and synthesize your research findings',
      };
    }

    if (context.lastPrompt) {
      return {
        text: 'Paste Research Results',
        href: '/admin/process-results',
        description: 'Return from Gemini/Perplexity with results',
      };
    }

    if (context.lastInvestigation) {
      return {
        text: 'Create Decision Log',
        href: '/admin/decision-logs',
        description: 'Document decisions from this investigation',
      };
    }

    if (context.lastDecisionLog) {
      return {
        text: 'Generate Scrollytelling',
        href: '/admin/scrollytelling',
        description: 'Create visual report from decision',
      };
    }

    return null;
  }
}
