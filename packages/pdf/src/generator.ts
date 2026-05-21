import { chromium } from "playwright";

/**
 * Renders raw HTML string into an A4 PDF binary buffer using headless Playwright Chromium.
 */
export async function generatePdfFromHtml(html: string, isLandscape: boolean = false): Promise<Buffer> {
  // Launch headless browser
  const browser = await chromium.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  
  try {
    const page = await browser.newPage();
    
    // Set viewport matching A4 proportions
    await page.setViewportSize({
      width: isLandscape ? 1123 : 794,
      height: isLandscape ? 794 : 1123,
    });
    
    // Inject HTML content and wait for load and network idle (important for images/logo loading)
    await page.setContent(html, { waitUntil: "load" });
    
    // Export to A4 PDF
    const pdfBuffer = await page.pdf({
      format: "A4",
      landscape: isLandscape,
      printBackground: true,
      margin: {
        top: "0px",
        right: "0px",
        bottom: "0px",
        left: "0px",
      },
    });
    
    return pdfBuffer;
  } finally {
    await browser.close();
  }
}
