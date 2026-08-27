const fs = require("fs");
const { execFileSync } = require("child_process");
const os = require("os");
const path = require("path");

const cacheDirectory = process.env.PUPPETEER_CACHE_DIR || path.join(os.homedir(), ".cache", "puppeteer");
const chromeCacheDirectory = path.join(cacheDirectory, "chrome");

fs.rmSync(chromeCacheDirectory, { recursive: true, force: true });

const puppeteerDirectory = path.dirname(require.resolve("puppeteer/package.json"));
const puppeteerCli = path.join(puppeteerDirectory, "lib", "cjs", "puppeteer", "node", "cli.js");
execFileSync(process.execPath, [puppeteerCli, "browsers", "install", "chrome"], {
	stdio: "inherit",
});
