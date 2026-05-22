import type {
  BrandingConfig,
  Round,
  Question,
} from "@trivia/shared";
import * as fs from "fs";
import * as path from "path";

export interface DecorationSelection {
  slotId: "header" | "side" | "footer";
  fileUrl: string;
  sizeCategory: "small" | "medium" | "large";
}

/**
 * Resolves a local relative file URL to a base64 encoded data URI to ensure perfect Playwright PDF rendering.
 */
function getBase64Image(fileUrl: string | undefined): string {
  if (!fileUrl) return "";
  try {
    if (fileUrl.startsWith("data:") || fileUrl.startsWith("http:") || fileUrl.startsWith("https:")) {
      return fileUrl;
    }
    
    // Check multiple potential paths for local files
    const possiblePaths = [
      path.join(process.cwd(), "apps/web/public", fileUrl),
      path.join(process.cwd(), "../web/public", fileUrl),
      path.join(process.cwd(), "../../apps/web/public", fileUrl),
      path.join(process.cwd(), "apps/api", fileUrl),
    ];
    
    for (const fullPath of possiblePaths) {
      if (fs.existsSync(fullPath)) {
        const ext = path.extname(fullPath).toLowerCase();
        let mime = "image/png";
        if (ext === ".svg") mime = "image/svg+xml";
        else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
        
        const base64 = fs.readFileSync(fullPath).toString("base64");
        return `data:${mime};base64,${base64}`;
      }
    }
  } catch (err) {
    console.error(`[PDF Templates] Failed to base64 inline image: ${fileUrl}`, err);
  }
  return fileUrl;
}

/**
 * Renders individual pre-sized decoration slots.
 */
function renderDecoSlot(slotId: "header" | "side" | "footer", decorations: DecorationSelection[]): string {
  const dec = decorations.find((d) => d.slotId === slotId);
  if (!dec) {
    // If no decoration is present, we still render the pre-sized dotted border placeholder
    // representing an elegant vintage coupon/stamp frame.
    if (slotId === "header") {
      return `
        <div class="deco-slot-header empty">
          <div class="stamp-label">TRIVIA</div>
        </div>
      `;
    }
    if (slotId === "side") {
      return `
        <div class="deco-slot-side empty">
          <div class="mascot-label">MASCOT</div>
        </div>
      `;
    }
    return ""; // Footer doesn't need empty placeholder
  }

  const base64Url = getBase64Image(dec.fileUrl);

  if (slotId === "header") {
    return `
      <div class="deco-slot-header">
        <img src="${base64Url}" class="cartoon-img" alt="Header Deco" onerror="this.style.display='none';" />
      </div>
    `;
  } else if (slotId === "side") {
    return `
      <div class="deco-slot-side">
        <img src="${base64Url}" class="cartoon-img" alt="Side Deco" onerror="this.style.display='none';" />
      </div>
    `;
  } else {
    return `
      <div class="deco-slot-footer">
        <img src="${base64Url}" class="cartoon-img-footer" alt="Footer Deco" onerror="this.style.display='none';" />
      </div>
    `;
  }
}

/**
 * Common layout styles for answer sheets.
 */
function getAnswerSheetStyles(isLandscape: boolean): string {
  return `
    @page {
      size: A4 ${isLandscape ? "landscape" : "portrait"};
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #000;
      background-color: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .sheet-page {
      width: ${isLandscape ? "297mm" : "210mm"};
      height: ${isLandscape ? "210mm" : "297mm"};
      padding: 25px 30px;
      box-sizing: border-box;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }
    .sheet-page:last-child {
      page-break-after: avoid;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #000;
      padding-bottom: 8px;
      margin-bottom: 12px;
      gap: 15px;
    }
    .branding-info {
      flex: 1;
    }
    .event-title {
      font-size: 22px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 1px 0;
      letter-spacing: 0.5px;
      line-height: 1.1;
    }
    .event-subtitle {
      font-size: 12px;
      font-weight: 500;
      color: #444;
      margin: 0 0 4px 0;
    }
    .round-title {
      font-size: 16px;
      font-weight: 700;
      color: #000;
      margin: 0;
      display: inline-block;
      border: 1.5px solid #000;
      padding: 3px 10px;
      background: #f0f0f0;
    }
    .meta-boxes {
      display: flex;
      gap: 10px;
      align-items: flex-start;
    }
    .score-box {
      border: 2px solid #000;
      padding: 6px 12px;
      text-align: center;
      background: #fff;
      min-width: 80px;
    }
    .score-label {
      font-size: 9px;
      font-weight: 700;
      text-transform: uppercase;
      margin-bottom: 1px;
    }
    .score-val {
      font-size: 20px;
      font-weight: 800;
    }
    
    .team-section {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 15px;
      background: #f9f9f9;
      border: 1px solid #ddd;
      padding: 8px 12px;
    }
    .team-label {
      font-size: 12px;
      font-weight: 700;
      text-transform: uppercase;
      white-space: nowrap;
    }
    .team-line {
      flex: 1;
      border-bottom: 2px dashed #000;
      height: 20px;
    }
    
    /* Pre-sized Graphics Slots */
    .deco-slot-header {
      width: 70px;
      height: 70px;
      border: 2px dashed #000;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #fff;
      position: relative;
    }
    .deco-slot-header.empty {
      background: #fafafa;
    }
    .deco-slot-header .stamp-label {
      font-size: 8px;
      font-weight: 800;
      color: #bbb;
      letter-spacing: 1px;
    }
    
    .side-panel {
      border: 2px dashed #000;
      border-radius: 6px;
      padding: 10px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 10px;
      height: 100%;
      background: #fafafa;
      box-sizing: border-box;
    }
    .deco-slot-side {
      width: 85px;
      height: 85px;
      border: 1.5px dashed #ccc;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #fff;
    }
    .deco-slot-side.empty {
      background: #f0f0f0;
    }
    .deco-slot-side .mascot-label {
      font-size: 8px;
      font-weight: 800;
      color: #ccc;
      letter-spacing: 0.5px;
    }
    .scribble-zone {
      width: 100%;
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border-top: 1px dashed #ccc;
      padding-top: 8px;
    }
    .scribble-title {
      font-size: 8px;
      font-weight: 800;
      text-transform: uppercase;
      text-align: center;
      color: #666;
      letter-spacing: 0.5px;
    }
    .scribble-line {
      border-bottom: 1px solid #ddd;
      height: 14px;
    }
    
    .deco-slot-footer {
      width: 120px;
      height: 40px;
      border: 1.5px dashed #000;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: #fff;
    }
    
    .cartoon-img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      filter: grayscale(100%);
    }
    .cartoon-img-footer {
      max-width: 95%;
      max-height: 90%;
      object-fit: contain;
      filter: grayscale(100%);
    }
    
    /* Layout Columns */
    .columns-container {
      display: flex;
      gap: 20px;
      flex: 1;
    }
    
    .answers-column {
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      height: 100%;
    }
    
    .answer-space {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .num-box {
      width: 28px;
      height: 28px;
      border: 1.5px solid #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 13px;
      background: #fff;
    }
    .line-space {
      flex: 1;
      border-bottom: 1.5px solid #aaa;
      height: 28px;
    }
    
    .footer-section {
      margin-top: auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-top: 1px solid #ccc;
      padding-top: 8px;
      font-size: 10px;
      color: #555;
    }
    
    .branding-logo {
      max-height: 40px;
      max-width: 120px;
      object-fit: contain;
    }
  `;
}

/**
 * Inner body HTML generation for answer sheets.
 */
function renderAnswerSheetBodyHtml(
  round: Round,
  branding: BrandingConfig,
  maxScore: number,
  decorations: DecorationSelection[]
): string {
  const isLandscape = round.answerSheetLayout === "landscape_20";
  
  let contentHtml = "";
  
  if (isLandscape) {
    // 3-column layout: Col 1 (Q1-10), Col 2 (Q11-20), Col 3 (Side Panel)
    contentHtml = `
      <div class="columns-container">
        <!-- Col 1 -->
        <div class="answers-column" style="width: 41%;">
          ${Array.from({ length: 10 }, (_, i) => i + 1)
            .map((num) => `
              <div class="answer-space">
                <div class="num-box">${num}</div>
                <div class="line-space"></div>
              </div>
            `).join("")}
        </div>
        
        <!-- Col 2 -->
        <div class="answers-column" style="width: 41%;">
          ${Array.from({ length: 10 }, (_, i) => i + 11)
            .map((num) => `
              <div class="answer-space">
                <div class="num-box">${num}</div>
                <div class="line-space"></div>
              </div>
            `).join("")}
        </div>
        
        <!-- Col 3 (Side Panel Graphic + Scribble) -->
        <div style="width: 18%;">
          <div class="side-panel">
            <div class="scribble-title">Mascot</div>
            ${renderDecoSlot("side", decorations)}
            <div class="scribble-zone">
              <div class="scribble-title">Scribble Zone</div>
              <div class="scribble-line"></div>
              <div class="scribble-line"></div>
              <div class="scribble-line"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  } else {
    // 2-column layout: Col 1 (Q1-10), Col 2 (Side Panel)
    contentHtml = `
      <div class="columns-container">
        <!-- Col 1 -->
        <div class="answers-column" style="width: 74%;">
          ${Array.from({ length: 10 }, (_, i) => i + 1)
            .map((num) => `
              <div class="answer-space">
                <div class="num-box">${num}</div>
                <div class="line-space"></div>
              </div>
            `).join("")}
        </div>
        
        <!-- Col 2 (Side Panel Graphic + Scribble) -->
        <div style="width: 26%;">
          <div class="side-panel">
            <div class="scribble-title">Round Mascot</div>
            ${renderDecoSlot("side", decorations)}
            <div class="scribble-zone">
              <div class="scribble-title">Scribble Zone</div>
              <div class="scribble-line"></div>
              <div class="scribble-line"></div>
              <div class="scribble-line"></div>
              <div class="scribble-line"></div>
              <div class="scribble-line"></div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  const logoBase64 = getBase64Image(branding.logoUrl);
  const logoHtml = logoBase64 
    ? `<img src="${logoBase64}" class="branding-logo" alt="Logo" onerror="this.style.display='none';" />`
    : "";

  return `
    <div class="sheet-page">
      <div class="header-section">
        <div class="branding-info">
          <div class="event-title">${branding.eventTitle}</div>
          ${branding.subtitle ? `<div class="event-subtitle">${branding.subtitle}</div>` : ""}
          <div class="round-title">${round.title}</div>
        </div>
        
        <div class="meta-boxes">
          ${logoHtml}
          ${renderDecoSlot("header", decorations)}
          <div class="score-box">
            <div class="score-label">Score</div>
            <div class="score-val">&nbsp;&nbsp;&nbsp;&nbsp; / ${maxScore}</div>
          </div>
          <div class="score-box" style="min-width: 100px;">
            <div class="score-label">Marker</div>
            <div class="score-val" style="font-size: 10px; height: 22px; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1.5px solid #555;"></div>
          </div>
        </div>
      </div>
      
      <div class="team-section">
        <div class="team-label">Team Name:</div>
        <div class="team-line"></div>
      </div>
      
      ${contentHtml}
      
      <div class="footer-section">
        <div>${branding.footerText}</div>
        ${renderDecoSlot("footer", decorations)}
        <div style="font-weight: 700; text-transform: uppercase;">Page 1 of 1</div>
      </div>
    </div>
  `;
}

/**
 * Renders a full A4 Portrait (10-question) or Landscape (20-question) answer sheet.
 */
export function renderAnswerSheetHtml(
  round: Round,
  branding: BrandingConfig,
  maxScore: number,
  decorations: DecorationSelection[]
): string {
  const isLandscape = round.answerSheetLayout === "landscape_20";
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Answer Sheet - ${round.title}</title>
      <style>
        ${getAnswerSheetStyles(isLandscape)}
      </style>
    </head>
    <body>
      ${renderAnswerSheetBodyHtml(round, branding, maxScore, decorations)}
    </body>
    </html>
  `;
}

/**
 * Common styles for marking guides.
 */
function getMarkingGuideStyles(): string {
  return `
    @page {
      size: A4 portrait;
      margin: 0;
    }
    body {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      color: #000;
      background-color: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    
    .guide-page {
      width: 210mm;
      height: 297mm;
      padding: 20px 25px;
      box-sizing: border-box;
      position: relative;
      page-break-after: always;
      display: flex;
      flex-direction: column;
    }
    .guide-page:last-child {
      page-break-after: avoid;
    }
    
    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px double #000;
      padding-bottom: 6px;
      margin-bottom: 12px;
    }
    .branding-info {
      flex: 1;
    }
    .event-title {
      font-size: 20px;
      font-weight: 800;
      text-transform: uppercase;
      margin: 0 0 1px 0;
    }
    .round-title {
      font-size: 15px;
      font-weight: 700;
      color: #333;
      margin: 0;
    }
    .guide-tag {
      display: inline-block;
      margin-top: 3px;
      background: #000;
      color: #fff;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      padding: 2px 6px;
      letter-spacing: 0.5px;
    }
    .score-box {
      border: 1.5px solid #000;
      padding: 4px 10px;
      text-align: center;
      background: #f5f5f5;
      min-width: 90px;
    }
    .score-label {
      font-size: 8px;
      font-weight: 700;
      text-transform: uppercase;
    }
    .score-val {
      font-size: 16px;
      font-weight: 800;
    }
    
    .dense-questions-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .q-row {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      border-bottom: 1px dashed #ddd;
      padding-bottom: 3px;
      margin-bottom: 3px;
      page-break-inside: avoid;
    }
    .q-row:last-child {
      border-bottom: none;
    }
    
    .q-left-box {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: #000;
      color: #fff;
      padding: 2px 4px;
      border-radius: 3px;
      min-width: 32px;
      box-sizing: border-box;
    }
    .q-num-tag {
      font-size: 10px;
      font-weight: 800;
    }
    .q-pts-tag {
      font-size: 7.5px;
      font-weight: 700;
      text-transform: uppercase;
      opacity: 0.85;
      margin-top: -1px;
    }
    
    .q-right-content {
      flex: 1;
    }
    .q-prompt-text {
      font-size: 11.5px;
      font-weight: 600;
      color: #000;
      margin-bottom: 1px;
      line-height: 1.2;
    }
    .q-answer-details {
      font-size: 10px;
      color: #222;
      line-height: 1.2;
    }
    
    .ans-label {
      font-weight: 700;
      color: #555;
      font-size: 9px;
      text-transform: uppercase;
    }
    .ans-val {
      color: #000;
      font-weight: 750;
    }
    .variants {
      font-size: 9px;
      color: #555;
      font-style: italic;
    }
    .multipoint-inline {
      display: inline;
    }
    .all-options-inline {
      font-size: 9px;
      color: #555;
      margin-left: 2px;
    }
    
    .no-questions {
      padding: 20px;
      text-align: center;
      border: 1.5px dashed #ccc;
      color: #666;
      font-size: 12px;
    }
    
    .footer {
      margin-top: auto;
      text-align: center;
      font-size: 9px;
      color: #777;
      border-top: 1px solid #eee;
      padding-top: 6px;
    }
  `;
}

/**
 * Inner body HTML generation for marking guides.
 */
function renderMarkingGuideBodyHtml(
  round: Round,
  branding: BrandingConfig,
  questions: Question[],
  maxScore: number
): string {
  const filledQuestions = questions
    .filter((q) => q.prompt.trim() !== "")
    .sort((a, b) => a.orderIndex - b.orderIndex);

  let questionListHtml = "";
  
  if (filledQuestions.length === 0) {
    questionListHtml = `<div class="no-questions">No questions configured for this round.</div>`;
  } else {
    questionListHtml += `<div class="dense-questions-list">`;
    filledQuestions.forEach((q) => {
      let answerDetails = "";

      const config = q.answerConfig as any;
      if (q.type === "standard" && config.type === "standard") {
        answerDetails = `<span class="ans-label">Ans:</span> <strong class="ans-val">${config.answer}</strong>`;
        if (config.acceptableAnswers && config.acceptableAnswers.length > 0) {
          answerDetails += ` <span class="variants">(Accepts: ${config.acceptableAnswers.join(", ")})</span>`;
        }
      } else if (q.type === "multipoint" && config.type === "multipoint") {
        answerDetails = `
          <span class="ans-label">Ans (1pt each):</span>
          <span class="multipoint-inline">${config.answers.map((ans: string) => `<strong class="ans-val">${ans}</strong>`).join(" &bull; ")}</span>
        `;
      } else if (q.type === "multiple_choice" && config.type === "multiple_choice") {
        const correctOpt = config.options.find(
          (opt: any) => opt.id === config.correctOptionId
        );
        answerDetails = `
          <span class="ans-label">Ans:</span> <strong class="ans-val">[${correctOpt?.label}] ${correctOpt?.text}</strong>
          <span class="all-options-inline">
            (Options: ${config.options.map((o: any) => `[${o.label}] ${o.text}`).join(", ")})
          </span>
        `;
      }

      questionListHtml += `
        <div class="q-row">
          <div class="q-left-box">
            <span class="q-num-tag">Q${q.orderIndex}</span>
            <span class="q-pts-tag">${q.points}pt${q.points > 1 ? "s" : ""}</span>
          </div>
          <div class="q-right-content">
            <div class="q-prompt-text">${q.prompt}</div>
            <div class="q-answer-details">${answerDetails}</div>
          </div>
        </div>
      `;
    });
    questionListHtml += `</div>`;
  }

  return `
    <div class="guide-page">
      <div class="header-section">
        <div class="branding-info">
          <div class="event-title">${branding.eventTitle}</div>
          <div class="round-title">${round.title}</div>
          <div class="guide-tag">Official Marking Guide</div>
        </div>
        <div class="score-box">
          <div class="score-label">Max Score</div>
          <div class="score-val">${maxScore} Pts</div>
        </div>
      </div>
      
      <div class="questions-container">
        ${questionListHtml}
      </div>
      
      <div class="footer">
        CONFIDENTIAL &mdash; FOR MARKERS ONLY &mdash; Generated by TriviaNightCreator
      </div>
    </div>
  `;
}

/**
 * Renders a full, printable A4 Marking Guide.
 */
export function renderMarkingGuideHtml(
  round: Round,
  branding: BrandingConfig,
  questions: Question[],
  maxScore: number
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Marking Guide - ${round.title}</title>
      <style>
        ${getMarkingGuideStyles()}
      </style>
    </head>
    <body>
      ${renderMarkingGuideBodyHtml(round, branding, questions, maxScore)}
    </body>
    </html>
  `;
}

/**
 * Renders a package of multiple Answer Sheets as a combined multi-page document.
 */
export function renderCombinedAnswerSheetsHtml(
  roundsData: {
    round: Round;
    branding: BrandingConfig;
    maxScore: number;
    decorations: DecorationSelection[];
  }[]
): string {
  // If there are rounds, we check the layout of the first round to set overall orientation
  const isLandscape = roundsData.length > 0 && roundsData[0]?.round?.answerSheetLayout === "landscape_20";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Answer Sheets Package</title>
      <style>
        ${getAnswerSheetStyles(isLandscape)}
      </style>
    </head>
    <body>
      ${roundsData
        .map(({ round, branding, maxScore, decorations }) => 
          renderAnswerSheetBodyHtml(round, branding, maxScore, decorations)
        )
        .join("")}
    </body>
    </html>
  `;
}

/**
 * Renders a package of multiple Marking Guides as a combined multi-page document.
 */
export function renderCombinedMarkingGuidesHtml(
  roundsData: {
    round: Round;
    branding: BrandingConfig;
    questions: Question[];
    maxScore: number;
  }[]
): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Marking Guides Package</title>
      <style>
        ${getMarkingGuideStyles()}
      </style>
    </head>
    <body>
      ${roundsData
        .map(({ round, branding, questions, maxScore }) => 
          renderMarkingGuideBodyHtml(round, branding, questions, maxScore)
        )
        .join("")}
    </body>
    </html>
  `;
}
