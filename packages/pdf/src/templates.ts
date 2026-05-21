import type {
  BrandingConfig,
  Round,
  Question,
} from "@trivia/shared";

interface DecorationSelection {
  slotId: "header" | "side" | "footer";
  fileUrl: string;
  sizeCategory: "small" | "medium" | "large";
}

/**
 * Returns CSS width based on cartoon size category.
 */
function getAssetWidth(sizeCategory: "small" | "medium" | "large"): string {
  switch (sizeCategory) {
    case "small":
      return "50px";
    case "medium":
      return "80px";
    case "large":
      return "110px";
  }
}

/**
 * Renders cartoon decoration HTML absolute tags.
 */
function renderDecorations(decorations: DecorationSelection[]): string {
  return decorations
    .map((dec) => {
      const width = getAssetWidth(dec.sizeCategory);
      let positioning = "";
      
      if (dec.slotId === "header") {
        positioning = `top: 20px; right: 25px;`;
      } else if (dec.slotId === "side") {
        positioning = `top: 45%; right: 20px;`;
      } else if (dec.slotId === "footer") {
        positioning = `bottom: 25px; left: 30px;`;
      }

      // We use base64 encoding or fallback to a standard relative asset or emoji/placeholder in headless environments
      // For this, we'll embed the img tag. To make it bulletproof B&W, we apply a print grayscale filter.
      return `
        <img src="${dec.fileUrl}" alt="Decoration" class="cartoon-decor" style="
          position: absolute;
          ${positioning}
          width: ${width};
          height: auto;
          filter: grayscale(100%);
          opacity: 0.95;
        " onerror="this.style.display='none';" />
      `;
    })
    .join("");
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
  const numQuestions = isLandscape ? 20 : 10;
  
  // Create answer spaces
  let spacesHtml = "";
  if (isLandscape) {
    // 2 columns of 10
    spacesHtml += `<div class="grid-columns">`;
    
    // Column 1 (Questions 1-10)
    spacesHtml += `<div class="column">`;
    for (let i = 1; i <= 10; i++) {
      spacesHtml += `
        <div class="answer-space">
          <div class="num-box">${i}</div>
          <div class="line-space"></div>
        </div>
      `;
    }
    spacesHtml += `</div>`;

    // Column 2 (Questions 11-20)
    spacesHtml += `<div class="column">`;
    for (let i = 11; i <= 20; i++) {
      spacesHtml += `
        <div class="answer-space">
          <div class="num-box">${i}</div>
          <div class="line-space"></div>
        </div>
      `;
    }
    spacesHtml += `</div>`;
    
    spacesHtml += `</div>`;
  } else {
    // Portrait: 1 column of 10
    spacesHtml += `<div class="single-column">`;
    for (let i = 1; i <= 10; i++) {
      spacesHtml += `
        <div class="answer-space">
          <div class="num-box">${i}</div>
          <div class="line-space"></div>
        </div>
      `;
    }
    spacesHtml += `</div>`;
  }

  const logoHtml = branding.logoUrl 
    ? `<img src="${branding.logoUrl}" class="branding-logo" alt="Logo" onerror="this.style.display='none';" />`
    : "";

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Answer Sheet - ${round.title}</title>
      <style>
        @page {
          size: A4 ${isLandscape ? "landscape" : "portrait"};
          margin: 0;
        }
        body {
          margin: 0;
          padding: 30px;
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #000;
          background-color: #fff;
          width: ${isLandscape ? "297mm" : "210mm"};
          height: ${isLandscape ? "210mm" : "297mm"};
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 2px solid #000;
          padding-bottom: 12px;
          margin-bottom: 20px;
        }
        .branding-info {
          flex: 1;
        }
        .event-title {
          font-size: 26px;
          font-weight: 800;
          text-transform: uppercase;
          margin: 0 0 2px 0;
          letter-spacing: 0.5px;
        }
        .event-subtitle {
          font-size: 14px;
          font-weight: 500;
          color: #444;
          margin: 0 0 8px 0;
        }
        .round-title {
          font-size: 20px;
          font-weight: 700;
          color: #000;
          margin: 0;
          display: inline-block;
          border: 2px solid #000;
          padding: 4px 12px;
          background: #f0f0f0;
        }
        .meta-boxes {
          display: flex;
          gap: 15px;
        }
        .score-box {
          border: 3px solid #000;
          padding: 8px 16px;
          text-align: center;
          background: #fff;
          min-width: 90px;
        }
        .score-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          margin-bottom: 2px;
        }
        .score-val {
          font-size: 24px;
          font-weight: 800;
        }
        
        .team-section {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 25px;
          background: #f9f9f9;
          border: 1px solid #ddd;
          padding: 10px 15px;
        }
        .team-label {
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          white-space: nowrap;
        }
        .team-line {
          flex: 1;
          border-bottom: 2px dashed #000;
          height: 24px;
        }
        
        /* Grid Column Styles */
        .grid-columns {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        .single-column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .column {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .answer-space {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .num-box {
          width: 32px;
          height: 32px;
          border: 2px solid #000;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 14px;
          background: #fff;
        }
        .line-space {
          flex: 1;
          border-bottom: 2px solid #aaa;
          height: 30px;
        }
        
        .footer-section {
          position: absolute;
          bottom: 30px;
          left: 30px;
          right: 30px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px solid #ccc;
          padding-top: 10px;
          font-size: 11px;
          color: #555;
        }
        
        .branding-logo {
          max-height: 45px;
          max-width: 150px;
          object-fit: contain;
        }
      </style>
    </head>
    <body>
      ${renderDecorations(decorations)}
      
      <div class="header-section">
        <div class="branding-info">
          <div class="event-title">${branding.eventTitle}</div>
          ${branding.subtitle ? `<div class="event-subtitle">${branding.subtitle}</div>` : ""}
          <div class="round-title">${round.title}</div>
        </div>
        
        <div class="meta-boxes">
          ${logoHtml}
          <div class="score-box">
            <div class="score-label">Score</div>
            <div class="score-val">&nbsp;&nbsp;&nbsp;&nbsp; / ${maxScore}</div>
          </div>
          <div class="score-box" style="min-width: 110px;">
            <div class="score-label">Marker Name</div>
            <div class="score-val" style="font-size: 12px; height: 30px; display: flex; align-items: flex-end; justify-content: center; border-bottom: 1px solid #555;"></div>
          </div>
        </div>
      </div>
      
      <div class="team-section">
        <div class="team-label">Team Name:</div>
        <div class="team-line"></div>
      </div>
      
      ${spacesHtml}
      
      <div class="footer-section">
        <div>${branding.footerText}</div>
        <div style="font-weight: 700; text-transform: uppercase;">Page 1 of 1</div>
      </div>
    </body>
    </html>
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
  // Sort non-empty questions by orderIndex
  const filledQuestions = questions
    .filter((q) => q.prompt.trim() !== "")
    .sort((a, b) => a.orderIndex - b.orderIndex);

  let questionListHtml = "";
  
  if (filledQuestions.length === 0) {
    questionListHtml = `<div class="no-questions">No questions configured for this round.</div>`;
  } else {
    filledQuestions.forEach((q) => {
      let answerDetails = "";

      const config = q.answerConfig as any;
      if (q.type === "standard" && config.type === "standard") {
        answerDetails = `<span class="ans-label">Correct Answer:</span> <strong class="ans-val">${config.answer}</strong>`;
        if (config.acceptableAnswers && config.acceptableAnswers.length > 0) {
          answerDetails += `<br/><span class="ans-label">Acceptable Variants:</span> ${config.acceptableAnswers.join(", ")}`;
        }
      } else if (q.type === "multipoint" && config.type === "multipoint") {
        answerDetails = `
          <span class="ans-label">Correct Answers (1 pt each):</span>
          <ul class="multipoint-list">
            ${config.answers.map((ans: string) => `<li>${ans}</li>`).join("")}
          </ul>
        `;
      } else if (q.type === "multiple_choice" && config.type === "multiple_choice") {
        const correctOpt = config.options.find(
          (opt: any) => opt.id === config.correctOptionId
        );
        answerDetails = `
          <span class="ans-label">Correct Option:</span> <strong class="ans-val">${correctOpt?.label} — ${correctOpt?.text}</strong>
          <div class="all-options">
            Options: ${config.options.map((o: any) => `[${o.label}] ${o.text}`).join(", ")}
          </div>
        `;
      }

      questionListHtml += `
        <div class="q-card">
          <div class="q-header">
            <span class="q-number">Question ${q.orderIndex}</span>
            <span class="q-points">${q.points} pt${q.points > 1 ? "s" : ""}</span>
          </div>
          <div class="q-prompt">${q.prompt}</div>
          <div class="q-answer">${answerDetails}</div>
        </div>
      `;
    });
  }

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Marking Guide - ${round.title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 0;
        }
        body {
          margin: 0;
          padding: 30px;
          box-sizing: border-box;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
          color: #000;
          background-color: #fff;
          width: 210mm;
          height: 297mm;
          position: relative;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        .header-section {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          border-bottom: 3px double #000;
          padding-bottom: 12px;
          margin-bottom: 25px;
        }
        .branding-info {
          flex: 1;
        }
        .event-title {
          font-size: 24px;
          font-weight: 800;
          text-transform: uppercase;
          margin: 0 0 2px 0;
        }
        .round-title {
          font-size: 18px;
          font-weight: 700;
          color: #333;
          margin: 0;
        }
        .guide-tag {
          display: inline-block;
          margin-top: 5px;
          background: #000;
          color: #fff;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          padding: 3px 8px;
          letter-spacing: 0.5px;
        }
        .score-box {
          border: 2px solid #000;
          padding: 6px 12px;
          text-align: center;
          background: #f5f5f5;
          min-width: 100px;
        }
        .score-label {
          font-size: 9px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .score-val {
          font-size: 20px;
          font-weight: 800;
        }
        
        .q-card {
          border: 1px solid #ccc;
          border-left: 5px solid #000;
          background: #fafafa;
          padding: 12px 15px;
          margin-bottom: 15px;
          page-break-inside: avoid;
        }
        .q-header {
          display: flex;
          justify-content: space-between;
          margin-bottom: 6px;
        }
        .q-number {
          font-weight: 800;
          font-size: 12px;
          text-transform: uppercase;
          color: #111;
        }
        .q-points {
          font-size: 11px;
          font-weight: 700;
          background: #ddd;
          padding: 2px 6px;
          border-radius: 2px;
        }
        .q-prompt {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 10px;
          color: #000;
        }
        .q-answer {
          font-size: 13px;
          color: #333;
          border-top: 1px dashed #ddd;
          padding-top: 8px;
        }
        .ans-label {
          font-weight: 700;
          color: #555;
        }
        .ans-val {
          color: #000;
          font-size: 14px;
        }
        .multipoint-list {
          margin: 4px 0 0 16px;
          padding: 0;
        }
        .multipoint-list li {
          font-weight: 600;
          margin-bottom: 2px;
        }
        .all-options {
          font-size: 11px;
          color: #666;
          margin-top: 4px;
        }
        .no-questions {
          padding: 30px;
          text-align: center;
          border: 2px dashed #ccc;
          color: #666;
          font-size: 14px;
        }
        .footer {
          position: absolute;
          bottom: 30px;
          left: 30px;
          right: 30px;
          text-align: center;
          font-size: 10px;
          color: #777;
          border-top: 1px solid #eee;
          padding-top: 10px;
        }
      </style>
    </head>
    <body>
      <div class="header-section">
        <div class="branding-info">
          <div class="event-title">${branding.eventTitle}</div>
          <div class="round-title">${round.title}</div>
          <div class="guide-tag">Official Marking Guide</div>
        </div>
        <div class="score-box">
          <div class="score-label">Max Round Score</div>
          <div class="score-val">${maxScore} Points</div>
        </div>
      </div>
      
      <div class="questions-container">
        ${questionListHtml}
      </div>
      
      <div class="footer">
        CONFIDENTIAL &mdash; FOR MARKERS ONLY &mdash; Generated automatically by TriviaNightCreator
      </div>
    </body>
    </html>
  `;
}
