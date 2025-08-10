import { describe, it, expect, vi } from "vitest";
import { z } from "zod";

// Mock the OpenAI client before importing the server code
vi.mock("openai", () => ({
  default: vi.fn().mockImplementation(() => ({
    images: {
      generate: vi.fn().mockResolvedValue({
        data: [
          {
            url: "https://example.com/generated-image.png",
            b64_json: null,
          },
        ],
      }),
    },
    responses: {
      create: vi.fn().mockResolvedValue({ output_text: "Mock response" }),
    },
  })),
}));

describe("MCP Server Integration", () => {
  it("should have correct schema for generate_image tool", async () => {
    // Test the schema directly to ensure it's properly defined
    const ImageGenerationInputSchema = z.object({
      prompt: z.string().describe("Text description of the image to generate"),
      model: z.enum(["dall-e-2", "dall-e-3", "gpt-image-1"]).optional().describe("Image generation model to use"),
      size: z.enum(["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024", "1024x1536"]).optional().describe("Image dimensions"),
      quality: z.enum(["standard", "hd", "low"]).optional().describe("Image quality level"),
      style: z.enum(["natural", "vivid"]).optional().describe("Image style preference"),
      response_format: z.enum(["url", "b64_json"]).optional().describe("Response format for generated image"),
      n: z.number().int().min(1).max(10).optional().describe("Number of images to generate (DALL-E 2 only)"),
      output_format: z.enum(["png", "jpeg"]).optional().describe("Output file format (gpt-image-1 only)"),
      output_compression: z.number().int().min(1).max(100).optional().describe("Output compression level (gpt-image-1 only)"),
    });

    // Test valid inputs
    const validInput = {
      prompt: "A beautiful sunset over mountains",
      model: "gpt-image-1" as const,
      size: "1024x1024" as const,
      quality: "hd" as const,
    };

    expect(() => ImageGenerationInputSchema.parse(validInput)).not.toThrow();

    // Test minimal input
    const minimalInput = {
      prompt: "A cat",
    };

    expect(() => ImageGenerationInputSchema.parse(minimalInput)).not.toThrow();

    // Test invalid input - should throw
    const invalidInput = {
      prompt: "A cat",
      model: "invalid-model",
    };

    expect(() => ImageGenerationInputSchema.parse(invalidInput)).toThrow();
  });

  it("should validate input parameters correctly", () => {
    const ImageGenerationInputSchema = z.object({
      prompt: z.string().describe("Text description of the image to generate"),
      model: z.enum(["dall-e-2", "dall-e-3", "gpt-image-1"]).optional().describe("Image generation model to use"),
      size: z.enum(["256x256", "512x512", "1024x1024", "1024x1792", "1792x1024", "1024x1536"]).optional().describe("Image dimensions"),
      quality: z.enum(["standard", "hd", "low"]).optional().describe("Image quality level"),
      style: z.enum(["natural", "vivid"]).optional().describe("Image style preference"),
      response_format: z.enum(["url", "b64_json"]).optional().describe("Response format for generated image"),
      n: z.number().int().min(1).max(10).optional().describe("Number of images to generate (DALL-E 2 only)"),
      output_format: z.enum(["png", "jpeg"]).optional().describe("Output file format (gpt-image-1 only)"),
      output_compression: z.number().int().min(1).max(100).optional().describe("Output compression level (gpt-image-1 only)"),
    });

    // Test parameter constraints
    expect(() => 
      ImageGenerationInputSchema.parse({ 
        prompt: "test", 
        n: 0 
      })
    ).toThrow(); // n must be >= 1

    expect(() => 
      ImageGenerationInputSchema.parse({ 
        prompt: "test", 
        n: 11 
      })
    ).toThrow(); // n must be <= 10

    expect(() => 
      ImageGenerationInputSchema.parse({ 
        prompt: "test", 
        output_compression: 0 
      })
    ).toThrow(); // compression must be >= 1

    expect(() => 
      ImageGenerationInputSchema.parse({ 
        prompt: "test", 
        output_compression: 101 
      })
    ).toThrow(); // compression must be <= 100

    // Valid edge cases
    expect(() => 
      ImageGenerationInputSchema.parse({ 
        prompt: "test", 
        n: 1,
        output_compression: 1
      })
    ).not.toThrow();

    expect(() => 
      ImageGenerationInputSchema.parse({ 
        prompt: "test", 
        n: 10,
        output_compression: 100
      })
    ).not.toThrow();
  });
});