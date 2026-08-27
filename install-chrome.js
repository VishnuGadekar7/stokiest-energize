const { install, resolveBuildId, Browser, BrowserPlatform } = require("@puppeteer/browsers");
const { writeFileSync, existsSync, rmSync, readdirSync } = require("fs");
const { join } = require("path");
const os = require("os");

async function main() {
  const cacheDir = join(__dirname, ".browser-cache");
  const chromeCacheDir = join(cacheDir, "chrome");

  console.log(`[chrome-install] Using cache directory: ${cacheDir}`);

  // 1. Clean up corrupted folders
  if (existsSync(chromeCacheDir)) {
    const versions = readdirSync(chromeCacheDir);
    for (const version of versions) {
      const platform = os.platform() === 'win32' ? 'win64' : (os.platform() === 'darwin' ? 'mac_arm' : 'linux64');
      const binaryName = os.platform() === 'win32' ? 'chrome.exe' : 'chrome';
      const binary = join(chromeCacheDir, version, `chrome-${platform}`, binaryName);
      
      if (!existsSync(binary)) {
        console.log(`[chrome-install] Corrupted folder detected (${version}) — binary missing. Removing...`);
        rmSync(join(chromeCacheDir, version), { recursive: true, force: true });
      }
    }
  }

  try {
    // 2. Resolve the latest stable Chrome build
    console.log("[chrome-install] Resolving latest Chrome build...");
    const platform = os.platform() === 'win32' ? BrowserPlatform.WIN64 : (os.platform() === 'darwin' ? BrowserPlatform.MAC_ARM : BrowserPlatform.LINUX);
    const buildId = await resolveBuildId(Browser.CHROME, platform, "latest");
    
    // 3. Install it using the programmatic API
    console.log(`[chrome-install] Installing Chrome build ${buildId}...`);
    const browserInfo = await install({
      browser: Browser.CHROME,
      buildId: buildId,
      cacheDir: cacheDir,
    });

    console.log(`[chrome-install] Chrome successfully installed at: ${browserInfo.executablePath}`);
    
    // 4. Save the exact executable path to a file so generatePDF.js can use it
    writeFileSync(join(__dirname, ".chrome-path"), browserInfo.executablePath, "utf-8");
    console.log("[chrome-install] Wrote executable path to .chrome-path");
    
  } catch (err) {
    console.error("[chrome-install] Failed to install Chrome:", err);
    process.exit(1);
  }
}

main();
