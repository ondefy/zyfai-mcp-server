import { Router } from "express";
import { protectedResourceScopes } from "../auth/tool-scope.js";
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
      scopes_supported: protectedResourceScopes(config.mcpWriteToolsEnabled),
      bearer_methods_supported: ["header"],
    });
  });

  return router;
}
