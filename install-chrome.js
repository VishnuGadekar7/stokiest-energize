const { install, resolveBuildId, Browser, BrowserPlatform } = require("@puppeteer/browsers");
const { existsSync, rmSync, readdirSync } = require("fs");
const { join } = require("path");
const os = require("os");

async function ensureChrome() {
  const cacheDir = join(__dirname, ".cache", "puppeteer");
  const chromeCacheDir = join(cacheDir, "chrome");
  const platformDir = os.platform() === "win32" ? "chrome-win64" : "chrome-linux64";
  const binaryName = os.platform() === "win32" ? "chrome.exe" : "chrome";

  // Check if a valid Chrome binary already exists
  if (existsSync(chromeCacheDir)) {
    for (const version of readdirSync(chromeCacheDir)) {
      const binary = join(chromeCacheDir, version, platformDir, binaryName);
      if (existsSync(binary)) {
        console.log(`[chrome] Already installed at: ${binary}`);
        return binary;
      } else {
        console.log(`[chrome] Removing broken folder: ${version}`);
        rmSync(join(chromeCacheDir, version), { recursive: true, force: true });
      }
    }
  }

  const platform =
    os.platform() === "win32"
      ? BrowserPlatform.WIN64
      : os.platform() === "darwin"
      ? BrowserPlatform.MAC_ARM
      : BrowserPlatform.LINUX;

  const buildId = await resolveBuildId(Browser.CHROME, platform, "latest");
  console.log(`[chrome] Installing Chrome ${buildId}...`);
  const result = await install({ browser: Browser.CHROME, buildId, cacheDir });
  console.log(`[chrome] Ready at: ${result.executablePath}`);
  return result.executablePath;
}

module.exports = { ensureChrome };
