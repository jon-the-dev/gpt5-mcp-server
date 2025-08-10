#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import OpenAI from "openai";
import { z } from "zod";
import { config } from "./config.js";
import { runQuery, generateImage } from "./openai.js";
import type { QueryInput, ImageGenerationInput } from "./openai.js";

// Initialize MCP server
const server = new McpServer({ name: "gpt5-mcp", version: "0.1.0" });

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.apiKey,
  maxRetries: config.maxRetries,
  timeout: config.timeoutMs,
});

// Input schema for the gpt5.query tool
const QueryInputSchema = z.object({
  query: z.string().describe("User question or instruction"),
  // Per-call overrides
  model: z.string().optional().describe("Model name, e.g. gpt-5"),
  system: z.string().optional().describe("Optional system prompt/instructions for the model"),
  reasoning_effort: z.enum(["low", "minimal", "medium", "high"]).optional(),
  verbosity: z.enum(["low", "medium", "high"]).optional(),
  tool_choice: z.enum(["auto", "none"]).optional(),
  parallel_tool_calls: z.boolean().optional(),
  max_output_tokens: z.number().int().positive().optional(),
  web_search: z
    .object({
      enabled: z.boolean().optional(),
      search_context_size: z.enum(["low", "medium", "high"]).optional(),
    })
    .optional(),
});

// Input schema for the generate_image tool
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

server.tool(
  "gpt5_query",
  "Query GPT-5 with optional Web Search Preview. Supports verbosity and reasoning effort.",
  { input: QueryInputSchema },
  async ({ input }) => {
    const parsed = QueryInputSchema.parse(input);
    try {
      const text = await runQuery(openai, parsed as QueryInput, config);
      return {
        content: [{ type: "text" as const, text: text || "No response text available." }],
      };
    } catch (error) {
      console.error("Error calling OpenAI API:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

server.tool(
  "generate_image",
  "Generate images using DALL-E 2, DALL-E 3, or GPT-Image-1. Supports various sizes, styles, and quality options.",
  { input: ImageGenerationInputSchema },
  async ({ input }) => {
    const parsed = ImageGenerationInputSchema.parse(input);
    try {
      const result = await generateImage(openai, parsed as ImageGenerationInput, config);
      
      // Format the response to include image URLs and metadata
      const imageInfos = result.images.map((image, index) => {
        let info = `Image ${index + 1}:`;
        if (image.url) {
          info += `\nURL: ${image.url}`;
        }
        if (image.revised_prompt) {
          info += `\nRevised Prompt: ${image.revised_prompt}`;
        }
        return info;
      });

      const responseText = [
        `Generated ${result.images.length} image(s) using ${result.model}`,
        `Size: ${result.size}`,
        "",
        ...imageInfos
      ].join("\n");

      return {
        content: [{ type: "text" as const, text: responseText }],
      };
    } catch (error) {
      console.error("Error generating image:", error);
      const message = error instanceof Error ? error.message : "Unknown error";
      return {
        content: [{ type: "text" as const, text: `Error: ${message}` }],
        isError: true,
      };
    }
  }
);

async function main() {
  if (!config.apiKey) {
    console.error("OPENAI_API_KEY is not set. Please set it in your environment or .env file.");
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error in main():", err);
  process.exit(1);
});
