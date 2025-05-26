import fs from "fs/promises";
import { performGoogleLogin } from "./utils/login";

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

export default async function globalSetup() {
  try {
    await fs.access("playwright.json");
    console.log("✅ Using existing auth session");
  } catch {
    console.log("🔑 No session found, running login...");
    await performGoogleLogin("playwright.json", BASE_URL);
  }
}
