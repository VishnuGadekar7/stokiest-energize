const { install, resolveBuildId, Browser, BrowserPlatform } = require("@puppeteer/browsers");
const { writeFileSync, existsSync, rmSync, readdirSync } = require("fs");
const { join } = require("path");
const os = require("os");

async function main() {
  const cacheDir = join(__dirname, ".cache", "puppeteer");
  const chromeCacheDir = join(cacheDir, "chrome");

  // Clean up any corrupted/partial download folders
  if (existsSync(chromeCacheDir)) {
    for (const version of readdirSync(chromeCacheDir)) {
      const binaryName = os.platform() === "win32" ? "chrome.exe" : "chrome";
      const platformDir = os.platform() === "win32" ? "chrome-win64" : "chrome-linux64";
      const binary = join(chromeCacheDir, version, platformDir, binaryName);
      if (!existsSync(binary)) {
        console.log(`[chrome] Removing broken folder: ${version}`);
        rmSync(join(chromeCacheDir, version), { recursive: true, force: true });
      } else {
        console.log(`[chrome] Already installed at: ${binary}`);
        writeFileSync(join(__dirname, ".chrome-path"), binary, "utf-8");
        console.log("[chrome] Path saved to .chrome-path");
        return;
      }
    }
  }

  const platform =
    os.platform() === "win32"
      ? BrowserPlatform.WIN64
      : os.platform() === "darwin"
      ? BrowserPlatform.MAC_ARM
      : BrowserPlatform.LINUX;

  console.log("[chrome] Resolving latest Chrome build...");
  const buildId = await resolveBuildId(Browser.CHROME, platform, "latest");
  console.log(`[chrome] Installing Chrome ${buildId}...`);

  const result = await install({
    browser: Browser.CHROME,
    buildId,
    cacheDir,
  });

  console.log(`[chrome] Installed at: ${result.executablePath}`);
  writeFileSync(join(__dirname, ".chrome-path"), result.executablePath, "utf-8");
  console.log("[chrome] Path saved to .chrome-path");
}

main().catch((err) => {
  console.error("[chrome] FATAL:", err.message);
  process.exit(1);
});
