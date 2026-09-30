import { Router } from "express";
import { config } from "../config/env.js";

export function createOAuthRoutes(): Router {
  const router = Router();

  router.get("/.well-known/oauth-protected-resource", (_req, res) => {
    res.json({
      resource: config.mcpResourceUrl,
      authorization_servers: [
        `${config.mcpAuthorizationServer}/api/v1/oauth`,
      ],
      scopes_supported: [
        "mcp:tools:read",
        "mcp:tools:write",
        "mcp:tools:write:configure",
        "mcp:tools:write:deposit",
      ],
      bearer_methods_supported: ["header"],
    });
  });

  return router;
}
