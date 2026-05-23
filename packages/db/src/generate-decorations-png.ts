import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DECORATIONS_DIR = path.resolve(__dirname, "../../../apps/web/public/assets/decorations");

// Load environment variables from root directory
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../../.env") });

const apiKey = process.env.OPEN_ROUTER_API_KEY;

if (!apiKey) {
  console.error("ERROR: OPEN_ROUTER_API_KEY is not defined in the environment variables or .env file.");
  process.exit(1);
}

// Ensure the target directory exists
if (!fs.existsSync(DECORATIONS_DIR)) {
  fs.mkdirSync(DECORATIONS_DIR, { recursive: true });
}

// 10 Portrait Assets (Aspect Ratio 2:3, mapping to 'medium')
const portraitAssets = [
  { id: "cartoon-giraffe", subject: "giraffe wearing a graduation cap" },
  { id: "cartoon-penguin", subject: "penguin holding a magnifying glass" },
  { id: "cartoon-wizard", subject: "teddy bear wizard wearing a wizard hat and holding a magic wand" },
  { id: "cartoon-lighthouse", subject: "smiling lighthouse with friendly eyes and light beams" },
  { id: "cartoon-robot", subject: "friendly robot standing and holding a scroll" },
  { id: "cartoon-detective", subject: "detective cat wearing a trench coat and looking through a magnifying glass" },
  { id: "cartoon-tree", subject: "smiling oak tree with little eyes and branches as arms" },
  { id: "cartoon-monster", subject: "one-eyed friendly cute monster waving happily" },
  { id: "cartoon-shield", subject: "smiling shield carrying a pencil like a sword" },
  { id: "cartoon-books-stack", subject: "tall vertical stack of books with cute little cartoon eyes peeking out" },
];

// 10 Landscape Assets (Aspect Ratio 4:1, mapping to 'large')
const landscapeAssets = [
  { id: "cartoon-stars-banner", subject: "clouds, crescent moon, and hanging stars banner" },
  { id: "cartoon-marching-ants", subject: "row of tiny ants marching, carrying party flags" },
  { id: "cartoon-trophies-banner", subject: "row of different shaped award trophies, medals, and stars" },
  { id: "cartoon-bullet-train", subject: "cute cartoon bullet train speeding on tracks with steam puffs" },
  { id: "cartoon-rolling-hills", subject: "gentle rolling hills with tiny flowers and a smiling sun" },
  { id: "cartoon-bookshelf", subject: "bookshelf full of books with a couple of cute bugs peeking" },
  { id: "cartoon-buntings", subject: "party flag buntings hanging with simple cute smiley faces" },
  { id: "cartoon-hot-air-balloons", subject: "three striped hot air balloons floating in the sky with clouds" },
  { id: "cartoon-paper-people", subject: "chain of paper cut children holding hands" },
  { id: "cartoon-pencils-banner", subject: "row of cheerful animated pencils and crayons standing side-by-side" },
];

async function generatePngGemini(id: string, promptText: string, isPortrait: boolean, filePath: string): Promise<void> {
  console.log(`Generating PNG for ${id} using Google Gemini 3.1 Flash Image Preview...`);

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://github.com/jdcb4/TriviaNightCreator",
          "X-Title": "TriviaNightCreator",
        },
        body: JSON.stringify({
          model: "google/gemini-3.1-flash-image-preview",
          modalities: ["image", "text"],
          messages: [
            {
              role: "user",
              content: promptText,
            },
          ],
          image_config: {
            aspect_ratio: isPortrait ? "2:3" : "4:1",
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${await response.text()}`);
      }

      const data = await response.json();
      const images = data.choices?.[0]?.message?.images;

      if (!images || images.length === 0) {
        throw new Error(`No image returned in response. Response: ${JSON.stringify(data)}`);
      }

      const imageUrl = images[0].image_url?.url || "";
      if (!imageUrl.startsWith("data:image/")) {
        throw new Error(`Invalid image data URL: ${imageUrl.substring(0, 100)}`);
      }

      const base64Data = imageUrl.replace(/^data:image\/[a-zA-Z]+;base64,/, "");
      fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      console.log(`Successfully generated and saved: ${filePath}`);
      return;
    } catch (error) {
      console.warn(`Attempt ${attempt} failed for ${id}:`, error);
      if (attempt === 3) throw error;
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }
}

async function run() {
  console.log("Starting high-quality PNG generation via OpenRouter (google/gemini-3.1-flash-image-preview)...");

  // Generate Portrait PNGs
  for (const asset of portraitAssets) {
    try {
      const promptText = `A cute vertical standing ${asset.subject} mascot cartoon character, simple black and white line art, flat minimalist doodle, pure white background, high contrast, clean outlines, no color, no shading, png`;
      const filePath = path.join(DECORATIONS_DIR, `${asset.id}.png`);
      await generatePngGemini(asset.id, promptText, true, filePath);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Delay to be friendly to rate limits
    } catch (e) {
      console.error(`Failed to generate PNG for portrait ${asset.id}:`, e);
    }
  }

  // Generate Landscape PNGs
  for (const asset of landscapeAssets) {
    try {
      const promptText = `A wide horizontal landscape banner showing ${asset.subject}, simple black and white cartoon line art, flat minimalist doodle, pure white background, high contrast, clean outlines, no color, no shading, png`;
      const filePath = path.join(DECORATIONS_DIR, `${asset.id}.png`);
      await generatePngGemini(asset.id, promptText, false, filePath);
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Delay to be friendly to rate limits
    } catch (e) {
      console.error(`Failed to generate PNG for landscape ${asset.id}:`, e);
    }
  }

  console.log("PNG generation completed successfully using google/gemini-3.1-flash-image-preview!");
}

run();
