import { db, pool } from "./db.js";
import { decorativeAssets } from "./schema.js";

const assetsToSeed = [
  // Existing 10 square PNG assets, now mapped to 'small' sizeCategory for stamps
  {
    id: "cartoon-brain",
    name: "Brain Lifting Weights",
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-brain.png",
  },
  {
    id: "cartoon-owl",
    name: "Wise Owl Reading",
    sizeCategory: "small",
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
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-trophy.png",
  },
  {
    id: "cartoon-rocket",
    name: "Rocket Blasting Off",
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-rocket.png",
  },
  {
    id: "cartoon-cat",
    name: "Cat with Question Mark",
    sizeCategory: "small",
    fileUrl: "/assets/decorations/cartoon-cat.png",
  },
  {
    id: "cartoon-dinosaur",
    name: "Smart Dino with Glasses",
    sizeCategory: "small",
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

  // 10 New Tall Portrait assets mapped to 'medium' sizeCategory
  {
    id: "cartoon-giraffe",
    name: "Cute Giraffe in Grad Cap",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-giraffe.png",
  },
  {
    id: "cartoon-penguin",
    name: "Penguin with Magnifying Glass",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-penguin.png",
  },
  {
    id: "cartoon-wizard",
    name: "Wizard Bear Mascot",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-wizard.png",
  },
  {
    id: "cartoon-lighthouse",
    name: "Happy Smiling Lighthouse",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-lighthouse.png",
  },
  {
    id: "cartoon-robot",
    name: "Helper Robot with Scroll",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-robot.png",
  },
  {
    id: "cartoon-detective",
    name: "Detective Cat Mascot",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-detective.png",
  },
  {
    id: "cartoon-tree",
    name: "Friendly Smiling Oak Tree",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-tree.png",
  },
  {
    id: "cartoon-monster",
    name: "One-Eyed Friendly Monster",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-monster.png",
  },
  {
    id: "cartoon-shield",
    name: "Smiling Shield with Pencil Sword",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-shield.png",
  },
  {
    id: "cartoon-books-stack",
    name: "Stack of Books with Eyes",
    sizeCategory: "medium",
    fileUrl: "/assets/decorations/cartoon-books-stack.png",
  },

  // 10 New Wide Landscape assets mapped to 'large' sizeCategory
  {
    id: "cartoon-stars-banner",
    name: "Night Sky Clouds & Stars",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-stars-banner.png",
  },
  {
    id: "cartoon-marching-ants",
    name: "Ants Marching Parade",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-marching-ants.png",
  },
  {
    id: "cartoon-trophies-banner",
    name: "Row of Award Trophies",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-trophies-banner.png",
  },
  {
    id: "cartoon-bullet-train",
    name: "Speeding Bullet Train Banner",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-bullet-train.png",
  },
  {
    id: "cartoon-rolling-hills",
    name: "Hills and Smiling Sun Banner",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-rolling-hills.png",
  },
  {
    id: "cartoon-bookshelf",
    name: "Bookshelf and Peeking Bugs",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-bookshelf.png",
  },
  {
    id: "cartoon-buntings",
    name: "Smiling Party Buntings",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-buntings.png",
  },
  {
    id: "cartoon-hot-air-balloons",
    name: "Hot Air Balloons in Sky",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-hot-air-balloons.svg",
  },
  {
    id: "cartoon-paper-people",
    name: "Chain of Paper Cut People",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-paper-people.svg",
  },
  {
    id: "cartoon-pencils-banner",
    name: "Row of Cheerful Pencils",
    sizeCategory: "large",
    fileUrl: "/assets/decorations/cartoon-pencils-banner.svg",
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
