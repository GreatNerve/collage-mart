import { chromium } from "@playwright/test";
export async function performGoogleLogin(
  authPath = "playwright.json",
  baseURL = "http://localhost:3000"
) {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  await page.goto(`${baseURL}/api/auth/signin`);
  await page.click("text=Sign in with Google");

  console.log("👉 Please complete Google sign-in manually...");
  await page.waitForURL(`${baseURL}/**`, { timeout: 120_000 });

  console.log("✅ Login successful, saving session...");
  await context.storageState({ path: authPath });
  await browser.close();
}
