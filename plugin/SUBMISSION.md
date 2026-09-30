# ChatGPT plugin submission checklist

1. Host portable package: `plugin.json` + `mcp.json` (production URL `https://mcp.zyf.ai/mcp`).
2. Domain verification: `https://mcp.zyf.ai/.well-known/openai-apps-challenge` (token from OpenAI portal).
3. OAuth: universal MCP URL, demo account without MFA, aligned `API_PUBLIC_URL` / `MCP_RESOURCE_URL` in zyfai-api + MCP env.
4. Scan Tools in OpenAI plugin portal; annotations must match tool behaviour (`readOnlyHint`, `destructiveHint`, `openWorldHint`).
5. Starter prompts: see `../docs/golden-prompts.md`.
6. Inspector checklist: initialize → tools/list (no write tools by default) → one read golden prompt → optional second MCP process instance.
7. Public write tools stay off in production until `MCP_WRITE_TOOLS_ENABLED=true` and mandates are configured per client on zyf.ai (Transparency → Agent access).
