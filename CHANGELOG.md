# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.0] - 2025-02-11

### Added

- MCP tool `gpt5_query` with support for model override, system prompt, reasoning effort, verbosity, and web search
- Web Search Preview integration with configurable context size
- `.env` file loading with multi-candidate resolution (ENV_FILE, CWD, project root)
- ESLint with typescript-eslint strict rules
- Makefile with standard targets (install, build, test, check, dev, lint, clean)
- CLAUDE.md project documentation
- Shared test helper (`tests/helpers.ts`) with `cfg()` factory

### Fixed

- **S1**: Server now exits with code 1 when `OPENAI_API_KEY` is missing (was silent no-op)
- **S2**: Query input bounded to 100,000 characters via Zod `.max(100_000)`

### Changed

- **Q2**: OpenAI SDK calls use proper `ResponseCreateParamsNonStreaming` typing instead of `as unknown as Record<string, unknown>`; response typed as SDK `Response` with direct `output_text` access
- **Q4**: TypeScript module resolution changed to `Node16`; removed `@ts-ignore` from CLI entry point
- **A1**: Config refactored to `createConfig(env)` factory function for testability; `config` export preserved for backward compatibility
- **Q1**: Test helper `cfg()` extracted to shared `tests/helpers.ts`; config tests simplified to use `createConfig()` directly
