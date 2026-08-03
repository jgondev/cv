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

  // The download button and the scrollspy highlight make no sense inside the PDF
  await page.addStyleTag({
    content: `
      .pdf-download { display: none !important; }
      .navbar-inverse .navbar-nav > .active > a {
        color: #8b8b8b !important;
        border-bottom: none !important;
      }
    `,
  });

  // Retarget nav links to invisible anchors placed a bit above each section,
  // so clicking them inside the PDF doesn't cut the section title
  await page.evaluate((offset) => {
    document.body.style.position = "relative";
    document.querySelectorAll('#navbar a[href^="#"]').forEach((link) => {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target || id === "top") return;
      const anchor = document.createElement("span");
      anchor.id = `${id}-pdf`;
      anchor.style.cssText = `position:absolute;left:0;width:1px;height:1px;top:${Math.max(
        0,
        target.getBoundingClientRect().top + window.scrollY - offset
      )}px`;
      document.body.appendChild(anchor);
      link.setAttribute("href", `#${id}-pdf`);
    });
  }, 100);

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
