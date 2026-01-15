#!/usr/bin/env node
/**
 * Quick test to verify .env loading
 */

import dotenv from "dotenv";
dotenv.config();

console.log("🔍 Testing .env loading...\n");

console.log("Environment variables:");
console.log("  PORT:", process.env.PORT || "(not set)");
console.log("  HOST:", process.env.HOST || "(not set)");
console.log("  ALLOWED_ORIGINS:", process.env.ALLOWED_ORIGINS || "(not set)");
console.log("  ZYFAI_API_KEY:", process.env.ZYFAI_API_KEY ? `${process.env.ZYFAI_API_KEY.substring(0, 20)}...` : "(not set)");

if (process.env.ZYFAI_API_KEY) {
  console.log("\n✅ ZYFAI_API_KEY is loaded correctly!");
} else {
  console.log("\n❌ ZYFAI_API_KEY is NOT set");
  console.log("\nPlease check:");
  console.log("  1. .env file exists in the project root");
  console.log("  2. .env file contains: ZYFAI_API_KEY=your_key_here");
  console.log("  3. No extra spaces or quotes around the key");
}
