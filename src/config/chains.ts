/**
 * Chain IDs accepted by MCP tools — must match @zyfai/sdk SupportedChainId.
 */

import { getSupportedChainIds, type SupportedChainId } from "@zyfai/sdk";
import { z } from "zod";

const supportedIds = getSupportedChainIds();

export const CHAIN_ID_DESCRIPTION =
  "Chain ID (1 Ethereum Mainnet, 8453 Base, 42161 Arbitrum)";

const literals = supportedIds.map((id) => z.literal(id)) as [
  z.ZodLiteral<SupportedChainId>,
  z.ZodLiteral<SupportedChainId>,
  ...z.ZodLiteral<SupportedChainId>[],
];

/** Required chainId tool parameter. */
export const chainIdSchema = z.union(literals);

/** Optional chainId filter on tools that support all chains. */
export const optionalChainIdSchema = chainIdSchema.optional();
