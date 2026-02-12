import type { AppConfig } from "../src/config.js";

export function cfg(partial: Partial<AppConfig> = {}): AppConfig {
  return {
    apiKey: "sk-test",
    model: "gpt-5",
    maxRetries: 3,
    timeoutMs: 60000,
    reasoningEffort: "medium",
    defaultVerbosity: "medium",
    webSearchDefaultEnabled: false,
    webSearchContextSize: "medium",
    ...partial,
  } as AppConfig;
}
