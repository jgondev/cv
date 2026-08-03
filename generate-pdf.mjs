// Generates cv.pdf: a single-page PDF sized to the full website,
// rendered with screen styles (colors, fonts and layout preserved).
// Usage: npm run pdf
import puppeteer from "puppeteer-core";
import { fileURLToPath } from "url";
import path from "path";

const WIDTH = 1440;
const CHROME = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

const root = path.dirname(fileURLToPath(import.meta.url));
const url = "file:///" + path.join(root, "index.html").replace(/\\/g, "/");

const browser = await puppeteer.launch({ executablePath: CHROME });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: 1000 });
  await page.goto(url, { waitUntil: "networkidle0" });
  await page.emulateMediaType("screen");
  await page.evaluate(() => document.fonts.ready);

  // The download button makes no sense inside the PDF itself
  await page.addStyleTag({ content: ".pdf-download { display: none !important; }" });

  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  await page.pdf({
    path: path.join(root, "cv.pdf"),
    width: `${WIDTH}px`,
    height: `${height}px`,
    printBackground: true,
    pageRanges: "1",
  });
  console.log(`cv.pdf generated (${WIDTH}x${height}px)`);
} finally {
  await browser.close();
}
