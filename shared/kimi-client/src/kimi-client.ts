import { ChatCompletionResponse, ChatMessage, KimiClientConfig } from './types';

interface ApiChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  model?: string;
  error?: {
    message?: string;
  };
}

export class KimiClient {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxRetries: number;
  private timeoutMs: number;

  constructor(config: KimiClientConfig) {
    if (!config.apiKey?.trim()) {
      throw new Error('Kimi API key is required.');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://api.moonshot.cn/v1';
    this.model = config.model ?? 'kimi-k2-0905';
    this.maxRetries = config.maxRetries ?? 3;
    this.timeoutMs = config.timeoutMs ?? 60000;
  }

  async chat(
    messages: ChatMessage[],
    options?: {
      temperature?: number;
      maxTokens?: number;
    },
  ): Promise<ChatCompletionResponse> {
    const temperature = options?.temperature ?? 0.7;
    const maxTokens = options?.maxTokens ?? 2048;

    for (let attempt = 0; ; attempt += 1) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

      try {
        const response = await fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.model,
            messages,
            temperature,
            max_tokens: maxTokens,
          }),
          signal: controller.signal,
        });

        const data = (await response.json()) as ApiChatCompletionResponse;

        if (!response.ok) {
          if ((response.status === 429 || response.status >= 500) && attempt < this.maxRetries) {
            await this.delay((attempt + 1) * 1000);
            continue;
          }

          const errorMessage = data.error?.message ?? `Kimi API request failed with status ${response.status}`;
          throw new Error(errorMessage);
        }

        const content = data.choices?.[0]?.message?.content;
        if (typeof content !== 'string') {
          throw new Error('Kimi API response did not include a valid completion content.');
        }

        return {
          content,
          usage: {
            promptTokens: data.usage?.prompt_tokens ?? 0,
            completionTokens: data.usage?.completion_tokens ?? 0,
            totalTokens: data.usage?.total_tokens ?? 0,
          },
          model: data.model ?? this.model,
          finishReason: data.choices?.[0]?.finish_reason ?? 'unknown',
        };
      } catch (error) {
        if (attempt < this.maxRetries && this.isRetryableError(error)) {
          await this.delay((attempt + 1) * 1000);
          continue;
        }

        if (error instanceof Error) {
          throw error;
        }

        throw new Error('Kimi API request failed with an unknown error.');
      } finally {
        clearTimeout(timeoutHandle);
      }
    }
  }

  async summarize(text: string, instruction: string): Promise<string> {
    const messages: ChatMessage[] = [
      { role: 'system', content: instruction },
      { role: 'user', content: text },
    ];
    const response = await this.chat(messages);
    return response.content;
  }

  private async delay(ms: number): Promise<void> {
    await new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private isRetryableError(error: unknown): boolean {
    return error instanceof TypeError || (error instanceof DOMException && error.name === 'AbortError');
  }
}
