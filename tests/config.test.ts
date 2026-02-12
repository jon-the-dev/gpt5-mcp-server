import { describe, it, expect } from "vitest";
import { createConfig } from "../src/config.js";

describe("createConfig", () => {
  it("falls back to defaults when env empty", () => {
    const config = createConfig({});
    expect(config.model).toBe("gpt-5");
    expect(config.maxRetries).toBe(3);
    expect(config.timeoutMs).toBe(60000);
    expect(config.defaultVerbosity).toBe("medium");
    expect(config.webSearchDefaultEnabled).toBe(false);
    expect(config.webSearchContextSize).toBe("medium");
    expect(config.apiKey).toBeUndefined();
  });

  it("reads values from env", () => {
    const config = createConfig({
      OPENAI_API_KEY: "sk-test-from-env",
      OPENAI_TIMEOUT_MS: "120000",
      REASONING_EFFORT: "low",
    });
    expect(config.apiKey).toBe("sk-test-from-env");
    expect(config.timeoutMs).toBe(120000);
    expect(config.reasoningEffort).toBe("minimal");
  });

  it("normalizes reasoning_effort: low -> minimal", () => {
    const config = createConfig({ REASONING_EFFORT: "low" });
    expect(config.reasoningEffort).toBe("minimal");
  });

  it("normalizes reasoning_effort: high", () => {
    const config = createConfig({ REASONING_EFFORT: "high" });
    expect(config.reasoningEffort).toBe("high");
  });

  it("boolean coercion for WEB_SEARCH_DEFAULT_ENABLED", () => {
    const config = createConfig({ WEB_SEARCH_DEFAULT_ENABLED: "true" });
    expect(config.webSearchDefaultEnabled).toBe(true);
  });

  it("boolean coercion returns false for unrecognized values", () => {
    const config = createConfig({ WEB_SEARCH_DEFAULT_ENABLED: "nope" });
    expect(config.webSearchDefaultEnabled).toBe(false);
  });

  it("uses custom model name", () => {
    const config = createConfig({ OPENAI_MODEL: "gpt-5.1" });
    expect(config.model).toBe("gpt-5.1");
  });
});
