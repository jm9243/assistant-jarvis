import { AgentConfig, AgentContext, AgentDecision, AgentNodeConfig, AgentNodeResult } from './types';

export class AgentNode {
  private config: AgentNodeConfig;
  private agentConfig: AgentConfig;

  constructor(nodeConfig: AgentNodeConfig, agentConfig: AgentConfig) {
    this.config = nodeConfig;
    this.agentConfig = agentConfig;
  }

  async makeDecision(context: AgentContext): Promise<AgentNodeResult> {
    if (!this.agentConfig.enabled) {
      return {
        success: false,
        error: 'Agent is disabled',
        logs: [],
      };
    }

    const logs: string[] = [];
    logs.push(`[Agent] Processing node: ${this.config.name}`);

    try {
      // Build the prompt for the agent
      const prompt = this.buildPrompt(context);
      logs.push(`[Agent] Prompt prepared (${prompt.length} chars)`);

      // Call the AI model to make a decision
      // This is a placeholder - actual implementation would call an API
      const decision = await this.callAIModel(prompt, logs);

      logs.push(`[Agent] Decision made with confidence: ${decision.confidence}`);

      return {
        success: true,
        decision,
        logs,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logs.push(`[Agent] Error: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        logs,
      };
    }
  }

  private buildPrompt(context: AgentContext): string {
    let prompt = this.config.systemPrompt || this.agentConfig.systemPrompt;

    if (context.currentScreenshot) {
      prompt += '\n\nCurrent screenshot: [image provided]';
    }

    if (context.elementTree) {
      prompt += `\n\nPage structure:\n${context.elementTree}`;
    }

    if (context.lastError) {
      prompt += `\n\nLast error: ${context.lastError}`;
    }

    if (context.recentLogs) {
      prompt += `\n\nRecent logs:\n${context.recentLogs.join('\n')}`;
    }

    return prompt;
  }

  private async callAIModel(prompt: string, logs: string[]): Promise<AgentDecision> {
    // Placeholder for AI model API call
    logs.push('[Agent] Calling AI model...');

    // Simulate API call
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          action: 'click',
          selector: '#submit-button',
          parameters: {},
          confidence: 0.85,
          reasoning: 'Based on the UI context, clicking the submit button appears to be the next logical action.',
        });
      }, 1000);
    });
  }

  getConfig(): AgentNodeConfig {
    return this.config;
  }
}
