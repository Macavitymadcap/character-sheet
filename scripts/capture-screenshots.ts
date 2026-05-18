#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer";
import { createInMemoryApp, login, startLocalServer, waitForHttp } from "./lib/local-app";

export const sheetScreenshotTargets = [
  {
    fileName: "lynott-sheet-light.png",
    label: "Lynott sheet light",
    theme: "light",
  },
  {
    fileName: "lynott-sheet-dark.png",
    label: "Lynott sheet dark",
    theme: "dark",
  },
  {
    fileName: "lynott-background-faction.png",
    label: "Lynott background faction",
    tabId: "background",
    theme: "light",
  },
] as const;

if (import.meta.main) {
  await captureSheetScreenshots();
}

export async function captureSheetScreenshots(
  outputDir = Bun.env.SCREENSHOT_DIR ?? "docs/pr-screenshots",
) {
  const runtime = createInMemoryApp("Character Sheet", "screenshots-session-secret");
  const server = await startLocalServer(runtime.app, { envName: "SCREENSHOT_PORT" });
  const baseUrl = `http://127.0.0.1:${server.port}`;
  let browser: Browser | undefined;

  try {
    await waitForHttp(`${baseUrl}/healthz`);
    await mkdir(outputDir, { recursive: true });

    const cookie = await login(baseUrl, "lynott@example.local");
    browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    const page = await browser.newPage();
    await page.setViewport({ deviceScaleFactor: 1, height: 844, width: 390 });
    await setSessionCookie(page, baseUrl, cookie);

    for (const target of sheetScreenshotTargets) {
      const path = resolve(outputDir, target.fileName);

      await setTheme(page, baseUrl, target.theme);
      await page.goto(`${baseUrl}/sheet/lynott`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector("#sheet-header");
      await page.waitForSelector('#sheet-tab-panel[data-tab-id="core"]');
      if ("tabId" in target) {
        await page.click(`#sheet-tab-${target.tabId}`);
        await page.waitForSelector(`#sheet-tab-panel[data-tab-id="${target.tabId}"]`);
      }
      await page.screenshot({ fullPage: true, path });

      console.log(`${target.label}: ${path}`);
    }
  } finally {
    await browser?.close();
    server.stop(true);
    runtime.close();
  }
}

async function setSessionCookie(page: Page, baseUrl: string, cookie: string) {
  const [name, value] = cookie.split("=");
  if (!name || !value) throw new Error("Could not parse login cookie for screenshots.");

  await page.setCookie({ name, url: baseUrl, value });
}

async function setTheme(page: Page, baseUrl: string, theme: "dark" | "light") {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded" });
  await page.evaluate((nextTheme) => {
    const storage = (globalThis as {
      localStorage?: { setItem: (key: string, value: string) => void };
    }).localStorage;

    storage?.setItem("character-sheet-theme", nextTheme);
  }, theme);
}
