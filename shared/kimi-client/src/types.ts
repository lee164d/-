export interface KimiClientConfig {
  apiKey: string;
  baseUrl?: string; // default: https://api.moonshot.cn/v1
  model?: string; // default: kimi-k2-0905
  maxRetries?: number; // default: 3
  timeoutMs?: number; // default: 60000
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatCompletionResponse {
  content: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  model: string;
  finishReason: string;
}
