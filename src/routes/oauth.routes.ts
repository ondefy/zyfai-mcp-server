import { Router } from "express";
import { config } from "../config/env.js";

export function createOAuthRoutes(): Router {
  const router = Router();

  router.get("/.well-known/oauth-protected-resource", (_req, res) => {
    const resourceBase = config.mcpResourceUrl.replace(/\/$/, "");
    const resource = resourceBase.endsWith("/mcp")
      ? resourceBase
      : `${resourceBase}/mcp`;
    res.json({
      resource,
      authorization_servers: [
        `${config.mcpAuthorizationServer}/api/v1/oauth`,
      ],
      scopes_supported: ["mcp:tools:read"],
      bearer_methods_supported: ["header"],
    });
  });

  return router;
}
