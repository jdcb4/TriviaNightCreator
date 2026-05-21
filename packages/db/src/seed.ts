import { db, pool } from "./db.js";
import { decorativeAssets } from "./schema.js";

const assetsToSeed = [
  {
    id: "cartoon-brain",
    name: "Brain Lifting Weights",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-brain.png",
  },
  {
    id: "cartoon-owl",
    name: "Wise Owl Reading",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-owl.png",
  },
  {
    id: "cartoon-lightbulb",
    name: "Thinking Lightbulb",
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-lightbulb.png",
  },
  {
    id: "cartoon-trophy",
    name: "Happy Trophy Cup",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-trophy.png",
  },
  {
    id: "cartoon-rocket",
    name: "Rocket Blasting Off",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-rocket.png",
  },
  {
    id: "cartoon-cat",
    name: "Cat with Question Mark",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-cat.png",
  },
  {
    id: "cartoon-dinosaur",
    name: "Smart Dino with Glasses",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-dinosaur.png",
  },
  {
    id: "cartoon-dice",
    name: "Rolling Dice Duo",
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-dice.png",
  },
  {
    id: "cartoon-pencil",
    name: "Cheerful Pencil Writing",
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-pencil.png",
  },
  {
    id: "cartoon-clock",
    name: "Animated Alarm Clock",
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-clock.png",
  },
];

async function seed() {
  console.log("Seeding decorative cartoon assets...");
  try {
    for (const asset of assetsToSeed) {
      await db
        .insert(decorativeAssets)
        .values(asset)
        .onConflictDoUpdate({
          target: decorativeAssets.id,
          set: {
            name: asset.name,
            sizeCategory: asset.sizeCategory,
            fileUrl: asset.fileUrl,
          },
        });
    }
    console.log("Decorative assets pre-seeded successfully!");
  } catch (error) {
    console.error("Seeding failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
