import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateImage, type ImageGenerationInput } from "../src/openai.js";
import type { AppConfig } from "../src/config.js";

// Mock OpenAI client
const mockOpenAI = {
  images: {
    generate: vi.fn(),
  },
} as any;

function cfg(partial: Partial<AppConfig> = {}): AppConfig {
  return {
    apiKey: "sk-test",
    model: "gpt-5",
    maxRetries: 3,
    timeoutMs: 60000,
    reasoningEffort: "medium",
    defaultVerbosity: "medium",
    webSearchDefaultEnabled: false,
    webSearchContextSize: "medium",
    imageModel: "gpt-image-1",
    imageSize: "1024x1024",
    imageQuality: "standard",
    imageResponseFormat: "url",
    ...partial,
  } as AppConfig;
}

describe("generateImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("generates image with minimal parameters", async () => {
    const mockResponse = {
      data: [
        {
          url: "https://example.com/image.png",
          b64_json: null,
        },
      ],
    };

    mockOpenAI.images.generate.mockResolvedValue(mockResponse);

    const input: ImageGenerationInput = {
      prompt: "A cute cat",
    };

    const result = await generateImage(mockOpenAI, input, cfg());

    expect(mockOpenAI.images.generate).toHaveBeenCalledWith({
      model: "gpt-image-1",
      prompt: "A cute cat",
      size: "1024x1024",
      response_format: "url",
      quality: "standard",
    });

    expect(result).toEqual({
      images: [
        {
          url: "https://example.com/image.png",
          b64_json: undefined,
          revised_prompt: undefined,
        },
      ],
      model: "gpt-image-1",
      size: "1024x1024",
    });
  });

  it("generates image with DALL-E 3 model", async () => {
    const mockResponse = {
      data: [
        {
          url: "https://example.com/image.png",
          b64_json: undefined,
          revised_prompt: "Enhanced: A cute cat sitting on a windowsill",
        },
      ],
    };

    mockOpenAI.images.generate.mockResolvedValue(mockResponse);

    const input: ImageGenerationInput = {
      prompt: "A cute cat",
      model: "dall-e-3",
      size: "1024x1792",
      quality: "hd",
      style: "vivid",
    };

    const result = await generateImage(mockOpenAI, input, cfg());

    expect(mockOpenAI.images.generate).toHaveBeenCalledWith({
      model: "dall-e-3",
      prompt: "A cute cat",
      size: "1024x1792",
      response_format: "url",
      quality: "hd",
      style: "vivid",
      n: 1,
    });

    expect(result.images[0].revised_prompt).toBe("Enhanced: A cute cat sitting on a windowsill");
  });

  it("generates multiple images with DALL-E 2", async () => {
    const mockResponse = {
      data: [
        { url: "https://example.com/image1.png", b64_json: null },
        { url: "https://example.com/image2.png", b64_json: null },
        { url: "https://example.com/image3.png", b64_json: null },
      ],
    };

    mockOpenAI.images.generate.mockResolvedValue(mockResponse);

    const input: ImageGenerationInput = {
      prompt: "A landscape",
      model: "dall-e-2",
      n: 3,
      size: "512x512",
    };

    const result = await generateImage(mockOpenAI, input, cfg());

    expect(mockOpenAI.images.generate).toHaveBeenCalledWith({
      model: "dall-e-2",
      prompt: "A landscape",
      size: "512x512",
      response_format: "url",
      n: 3,
    });

    expect(result.images).toHaveLength(3);
  });

  it("throws error when requesting multiple images with DALL-E 3", async () => {
    const input: ImageGenerationInput = {
      prompt: "A cat",
      model: "dall-e-3",
      n: 2,
    };

    await expect(generateImage(mockOpenAI, input, cfg())).rejects.toThrow(
      "DALL-E 3 only supports generating 1 image at a time"
    );
  });

  it("includes gpt-image-1 specific parameters", async () => {
    const mockResponse = {
      data: [
        {
          url: "https://example.com/image.jpg",
          b64_json: null,
        },
      ],
    };

    mockOpenAI.images.generate.mockResolvedValue(mockResponse);

    const input: ImageGenerationInput = {
      prompt: "A robot",
      model: "gpt-image-1",
      output_format: "jpeg",
      output_compression: 80,
      quality: "low",
    };

    const result = await generateImage(mockOpenAI, input, cfg());

    expect(mockOpenAI.images.generate).toHaveBeenCalledWith({
      model: "gpt-image-1",
      prompt: "A robot",
      size: "1024x1024",
      response_format: "url",
      quality: "low",
      output_format: "jpeg",
      output_compression: 80,
    });
  });

  it("returns base64 encoded image when requested", async () => {
    const mockResponse = {
      data: [
        {
          url: null,
          b64_json: "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==",
        },
      ],
    };

    mockOpenAI.images.generate.mockResolvedValue(mockResponse);

    const input: ImageGenerationInput = {
      prompt: "A pixel",
      response_format: "b64_json",
    };

    const result = await generateImage(mockOpenAI, input, cfg());

    expect(mockOpenAI.images.generate).toHaveBeenCalledWith({
      model: "gpt-image-1",
      prompt: "A pixel",
      size: "1024x1024",
      response_format: "b64_json",
      quality: "standard",
    });

    expect(result.images[0].b64_json).toBe("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==");
  });
});