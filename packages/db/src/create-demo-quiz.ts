import { db, pool } from "./db.js";
import {
  triviaNights,
  accessTokens,
  rounds,
  questions,
  teams,
} from "./schema.js";
import { createHash, randomBytes } from "crypto";

function generateToken(prefix: "edit" | "present"): string {
  return `${prefix}_${randomBytes(24).toString("hex")}`;
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

async function createDemoQuiz() {
  console.log("Creating high-quality demo quiz...");
  const triviaNightId = crypto.randomUUID();
  const now = new Date();

  // Create raw tokens
  const rawEditToken = generateToken("edit");
  const rawPresentToken = generateToken("present");

  try {
    // 1. Insert Trivia Night
    await db.insert(triviaNights).values({
      id: triviaNightId,
      title: "Ultimate Trivia Showdown",
      subtitle: "A Premium Demo Quiz with General Knowledge, Science, & Pop Culture",
      date: "2026-05-21",
      venue: "The Great Hall",
      status: "ready", // Mark it as ready for hosting!
      branding: {
        eventTitle: "Ultimate Trivia Showdown",
        subtitle: "A Premium Demo Quiz",
        footerText: "Please write clearly. Hand this sheet in at the end of the round.",
      },
      settings: {
        allowLateTeamRegistration: true,
        showLiveLeaderboard: true,
      },
      createdAt: now,
      updatedAt: now,
    });

    // 2. Insert Access Tokens
    await db.insert(accessTokens).values([
      {
        id: crypto.randomUUID(),
        triviaNightId,
        tokenHash: hashToken(rawEditToken),
        accessType: "edit",
        createdAt: now,
      },
      {
        id: crypto.randomUUID(),
        triviaNightId,
        tokenHash: hashToken(rawPresentToken),
        accessType: "present",
        createdAt: now,
      },
    ]);

    // 3. Insert 4 Fun Teams
    const teamNames = [
      "The Brainiacs",
      "Quizlamic State",
      "Smartypants",
      "Trivia Newton-John",
    ];
    for (const [i, name] of teamNames.entries()) {
      await db.insert(teams).values({
        id: crypto.randomUUID(),
        triviaNightId,
        name: name,
        orderIndex: i + 1,
      });
    }

    // 4. Insert 3 Rounds (Landscape 20 layout)
    const round1Id = crypto.randomUUID();
    const round2Id = crypto.randomUUID();
    const round3Id = crypto.randomUUID();

    await db.insert(rounds).values([
      {
        id: round1Id,
        triviaNightId,
        title: "Round 1: General Knowledge",
        orderIndex: 1,
        type: "question_round",
        answerSheetLayout: "landscape_20",
        answersRevealed: false,
      },
      {
        id: round2Id,
        triviaNightId,
        title: "Round 2: Science & Nature",
        orderIndex: 2,
        type: "question_round",
        answerSheetLayout: "landscape_20",
        answersRevealed: false,
      },
      {
        id: round3Id,
        triviaNightId,
        title: "Round 3: Pop Culture & Entertainment",
        orderIndex: 3,
        type: "question_round",
        answerSheetLayout: "landscape_20",
        answersRevealed: false,
      },
    ]);

    // Questions lists
    const round1Questions = [
      { orderIndex: 1, type: "standard", prompt: "What is the capital of Australia?", points: 1, answerConfig: { type: "standard", answer: "Canberra", acceptableAnswers: ["canberra"] } },
      {
        orderIndex: 2,
        type: "multiple_choice",
        prompt: "Which country is home to the kangaroo?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "South Africa" },
            { id: "b", label: "B", text: "Brazil" },
            { id: "c", label: "C", text: "Australia" },
            { id: "d", label: "D", text: "India" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 3, type: "standard", prompt: "Which ocean is the largest on Earth?", points: 1, answerConfig: { type: "standard", answer: "Pacific Ocean", acceptableAnswers: ["pacific", "pacific ocean"] } },
      {
        orderIndex: 4,
        type: "multiple_choice",
        prompt: "What is the signature alcoholic ingredient in a classic Margarita cocktail?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Vodka" },
            { id: "b", label: "B", text: "Tequila" },
            { id: "c", label: "C", text: "Rum" },
            { id: "d", label: "D", text: "Gin" }
          ],
          correctOptionId: "b"
        }
      },
      { orderIndex: 5, type: "multipoint", prompt: "Name two countries that share a land border with Spain.", points: 2, answerConfig: { type: "multipoint", answers: ["Portugal", "France", "Andorra", "Gibraltar", "Morocco"], pointsPerAnswer: 1 } },
      { orderIndex: 6, type: "standard", prompt: "How many players are on the field for one team in a standard soccer match?", points: 1, answerConfig: { type: "standard", answer: "11", acceptableAnswers: ["11", "eleven"] } },
      { orderIndex: 7, type: "standard", prompt: "What is the official currency of Japan?", points: 1, answerConfig: { type: "standard", answer: "Yen", acceptableAnswers: ["yen", "jpy"] } },
      { orderIndex: 8, type: "standard", prompt: "In which European city is the Eiffel Tower located?", points: 1, answerConfig: { type: "standard", answer: "Paris", acceptableAnswers: ["paris"] } },
      {
        orderIndex: 9,
        type: "multiple_choice",
        prompt: "Which language has the most native speakers in the world?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Spanish" },
            { id: "b", label: "B", text: "English" },
            { id: "c", label: "C", text: "Mandarin Chinese" },
            { id: "d", label: "D", text: "Hindi" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 10, type: "standard", prompt: "What is widely considered the longest river in the world?", points: 1, answerConfig: { type: "standard", answer: "Nile", acceptableAnswers: ["nile", "the nile", "nile river"] } },
      { orderIndex: 11, type: "standard", prompt: "Which country gifted the Statue of Liberty to the United States?", points: 1, answerConfig: { type: "standard", answer: "France", acceptableAnswers: ["france"] } },
      { orderIndex: 12, type: "standard", prompt: "What does a thermometer measure?", points: 1, answerConfig: { type: "standard", answer: "Temperature", acceptableAnswers: ["temperature", "heat"] } },
      {
        orderIndex: 13,
        type: "multiple_choice",
        prompt: "Which of these is NOT a primary color?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Red" },
            { id: "b", label: "B", text: "Yellow" },
            { id: "c", label: "C", text: "Green" },
            { id: "d", label: "D", text: "Blue" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 14, type: "standard", prompt: "What is the capital of Italy?", points: 1, answerConfig: { type: "standard", answer: "Rome", acceptableAnswers: ["rome"] } },
      { orderIndex: 15, type: "multipoint", prompt: "Name the two largest states in the United States by land area.", points: 2, answerConfig: { type: "multipoint", answers: ["Alaska", "Texas"], pointsPerAnswer: 1 } },
      { orderIndex: 16, type: "standard", prompt: "How many days are in a leap year?", points: 1, answerConfig: { type: "standard", answer: "366", acceptableAnswers: ["366", "three hundred sixty six"] } },
      { orderIndex: 17, type: "standard", prompt: "What is the main/base ingredient used to make hummus?", points: 1, answerConfig: { type: "standard", answer: "Chickpeas", acceptableAnswers: ["chickpeas", "chickpea", "garbanzo beans", "garbanzo"] } },
      { orderIndex: 18, type: "standard", prompt: "Which country is known as the Land of the Rising Sun?", points: 1, answerConfig: { type: "standard", answer: "Japan", acceptableAnswers: ["japan"] } },
      {
        orderIndex: 19,
        type: "multiple_choice",
        prompt: "Which geometric shape has exactly three sides?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Square" },
            { id: "b", label: "B", text: "Triangle" },
            { id: "c", label: "C", text: "Circle" },
            { id: "d", label: "D", text: "Hexagon" }
          ],
          correctOptionId: "b"
        }
      },
      { orderIndex: 20, type: "standard", prompt: "In what year did the Titanic sink in the North Atlantic Ocean?", points: 1, answerConfig: { type: "standard", answer: "1912", acceptableAnswers: ["1912"] } }
    ];

    const round2Questions = [
      { orderIndex: 1, type: "standard", prompt: "What is the chemical symbol for gold?", points: 1, answerConfig: { type: "standard", answer: "Au", acceptableAnswers: ["au", "gold"] } },
      {
        orderIndex: 2,
        type: "multiple_choice",
        prompt: "What is the closest star to the planet Earth?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Proxima Centauri" },
            { id: "b", label: "B", text: "Sirius" },
            { id: "c", label: "C", text: "The Sun" },
            { id: "d", label: "D", text: "Betelgeuse" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 3, type: "standard", prompt: "How many bones are there in a standard adult human body?", points: 1, answerConfig: { type: "standard", answer: "206", acceptableAnswers: ["206", "two hundred six"] } },
      { orderIndex: 4, type: "standard", prompt: "Which gas do plants absorb from the atmosphere for photosynthesis?", points: 1, answerConfig: { type: "standard", answer: "Carbon Dioxide", acceptableAnswers: ["carbon dioxide", "co2"] } },
      { orderIndex: 5, type: "multipoint", prompt: "Name two elements on the periodic table that are liquid at standard room temperature and pressure.", points: 2, answerConfig: { type: "multipoint", answers: ["Mercury", "Bromine"], pointsPerAnswer: 1 } },
      { orderIndex: 6, type: "standard", prompt: "What is the largest mammal currently living in the world?", points: 1, answerConfig: { type: "standard", answer: "Blue Whale", acceptableAnswers: ["blue whale", "whale"] } },
      { orderIndex: 7, type: "standard", prompt: "What invisible physical force keeps us and objects anchored on the ground?", points: 1, answerConfig: { type: "standard", answer: "Gravity", acceptableAnswers: ["gravity", "gravitational force"] } },
      {
        orderIndex: 8,
        type: "multiple_choice",
        prompt: "Which planet in our solar system is closest to the Sun?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Venus" },
            { id: "b", label: "B", text: "Earth" },
            { id: "c", label: "C", text: "Mercury" },
            { id: "d", label: "D", text: "Mars" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 9, type: "standard", prompt: "What is the hard, protective outer layer of a tree trunk called?", points: 1, answerConfig: { type: "standard", answer: "Bark", acceptableAnswers: ["bark"] } },
      { orderIndex: 10, type: "standard", prompt: "What is the boiling point of pure water at sea level in Celsius?", points: 1, answerConfig: { type: "standard", answer: "100", acceptableAnswers: ["100", "100 c", "100 degrees", "100 degrees celsius"] } },
      { orderIndex: 11, type: "standard", prompt: "Which primary human organ is responsible for pumping blood throughout the circulatory system?", points: 1, answerConfig: { type: "standard", answer: "Heart", acceptableAnswers: ["heart"] } },
      { orderIndex: 12, type: "standard", prompt: "How many legs does a spider have?", points: 1, answerConfig: { type: "standard", answer: "8", acceptableAnswers: ["8", "eight"] } },
      {
        orderIndex: 13,
        type: "multiple_choice",
        prompt: "Which of these animals is classified as a herbivore?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Lion" },
            { id: "b", label: "B", text: "Cow" },
            { id: "c", label: "C", text: "Wolf" },
            { id: "d", label: "D", text: "Shark" }
          ],
          correctOptionId: "b"
        }
      },
      { orderIndex: 14, type: "standard", prompt: "What is the scientific study of mushrooms and other fungi called?", points: 1, answerConfig: { type: "standard", answer: "Mycology", acceptableAnswers: ["mycology"] } },
      { orderIndex: 15, type: "multipoint", prompt: "Name the two main gases that make up over 99% of Earth's atmosphere.", points: 2, answerConfig: { type: "multipoint", answers: ["Nitrogen", "Oxygen"], pointsPerAnswer: 1 } },
      { orderIndex: 16, type: "standard", prompt: "What is the chemical formula for water?", points: 1, answerConfig: { type: "standard", answer: "H2O", acceptableAnswers: ["h2o"] } },
      { orderIndex: 17, type: "standard", prompt: "Which planet in our solar system is most famous for its beautiful, prominent ring system?", points: 1, answerConfig: { type: "standard", answer: "Saturn", acceptableAnswers: ["saturn"] } },
      { orderIndex: 18, type: "standard", prompt: "What is the fastest land animal in the world?", points: 1, answerConfig: { type: "standard", answer: "Cheetah", acceptableAnswers: ["cheetah"] } },
      {
        orderIndex: 19,
        type: "multiple_choice",
        prompt: "What biological class of animals does a frog belong to?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Mammal" },
            { id: "b", label: "B", text: "Reptile" },
            { id: "c", label: "C", text: "Amphibian" },
            { id: "d", label: "D", text: "Fish" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 20, type: "standard", prompt: "What is the dense central core of an atom, containing protons and neutrons, called?", points: 1, answerConfig: { type: "standard", answer: "Nucleus", acceptableAnswers: ["nucleus"] } }
    ];

    const round3Questions = [
      { orderIndex: 1, type: "standard", prompt: "Which iconic pop singer is widely known as the 'Queen of Pop'?", points: 1, answerConfig: { type: "standard", answer: "Madonna", acceptableAnswers: ["madonna"] } },
      {
        orderIndex: 2,
        type: "multiple_choice",
        prompt: "Who played the character Jack Dawson in the blockbuster 1997 movie Titanic?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Brad Pitt" },
            { id: "b", label: "B", text: "Tom Cruise" },
            { id: "c", label: "C", text: "Leonardo DiCaprio" },
            { id: "d", label: "D", text: "Johnny Depp" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 3, type: "standard", prompt: "Which wizarding school house does Harry Potter belong to?", points: 1, answerConfig: { type: "standard", answer: "Gryffindor", acceptableAnswers: ["gryffindor"] } },
      { orderIndex: 4, type: "standard", prompt: "What is the name of the fictional continent where the majority of Game of Thrones takes place?", points: 1, answerConfig: { type: "standard", answer: "Westeros", acceptableAnswers: ["westeros"] } },
      { orderIndex: 5, type: "multipoint", prompt: "Name the two lead actors who starred as Agents J and K in the 1997 sci-fi comedy Men in Black.", points: 2, answerConfig: { type: "multipoint", answers: ["Will Smith", "Tommy Lee Jones"], pointsPerAnswer: 1 } },
      { orderIndex: 6, type: "standard", prompt: "How many members were there in the legendary rock band The Beatles?", points: 1, answerConfig: { type: "standard", answer: "4", acceptableAnswers: ["4", "four"] } },
      { orderIndex: 7, type: "standard", prompt: "What is the name of the green ogre in the popular animated DreamWorks film series?", points: 1, answerConfig: { type: "standard", answer: "Shrek", acceptableAnswers: ["shrek"] } },
      {
        orderIndex: 8,
        type: "multiple_choice",
        prompt: "Which pop icon performed the hit song and music video 'Thriller' in 1982?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Prince" },
            { id: "b", label: "B", text: "Michael Jackson" },
            { id: "c", label: "C", text: "David Bowie" },
            { id: "d", label: "D", text: "Elton John" }
          ],
          correctOptionId: "b"
        }
      },
      { orderIndex: 9, type: "standard", prompt: "What is the name of the fictional Scandinavian-inspired kingdom in Disney's Frozen?", points: 1, answerConfig: { type: "standard", answer: "Arendelle", acceptableAnswers: ["arendelle"] } },
      { orderIndex: 10, type: "standard", prompt: "Which actor played Tony Stark/Iron Man in the Marvel Cinematic Universe starting in 2008?", points: 1, answerConfig: { type: "standard", answer: "Robert Downey Jr.", acceptableAnswers: ["robert downey jr", "robert downey jr.", "robert downey"] } },
      { orderIndex: 11, type: "standard", prompt: "Which popular Netflix sci-fi drama show features characters named Eleven, Mike, Dustin, and Will?", points: 1, answerConfig: { type: "standard", answer: "Stranger Things", acceptableAnswers: ["stranger things"] } },
      { orderIndex: 12, type: "standard", prompt: "Which famous English playwright wrote the classic tragedy Romeo and Juliet?", points: 1, answerConfig: { type: "standard", answer: "William Shakespeare", acceptableAnswers: ["william shakespeare", "shakespeare"] } },
      {
        orderIndex: 13,
        type: "multiple_choice",
        prompt: "Which legendary British rock band performed the operatic masterpiece song 'Bohemian Rhapsody'?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Led Zeppelin" },
            { id: "b", label: "B", text: "The Who" },
            { id: "c", label: "C", text: "Queen" },
            { id: "d", label: "D", text: "Pink Floyd" }
          ],
          correctOptionId: "c"
        }
      },
      { orderIndex: 14, type: "standard", prompt: "What is the highest-grossing film of all time worldwide, unadjusted for inflation?", points: 1, answerConfig: { type: "standard", answer: "Avatar", acceptableAnswers: ["avatar"] } },
      { orderIndex: 15, type: "multipoint", prompt: "Name the two main Hollywood voice actors who play Woody and Buzz Lightyear in the Toy Story series.", points: 2, answerConfig: { type: "multipoint", answers: ["Tom Hanks", "Tim Allen"], pointsPerAnswer: 1 } },
      { orderIndex: 16, type: "standard", prompt: "How many seasons of the highly popular sitcom Friends were produced and broadcast?", points: 1, answerConfig: { type: "standard", answer: "10", acceptableAnswers: ["10", "ten"] } },
      { orderIndex: 17, type: "standard", prompt: "Who is the green-clad heroic main protagonist in Nintendo's The Legend of Zelda video game franchise?", points: 1, answerConfig: { type: "standard", answer: "Link", acceptableAnswers: ["link"] } },
      { orderIndex: 18, type: "standard", prompt: "Which popular social media application is known for its viral, short-form mobile videos?", points: 1, answerConfig: { type: "standard", answer: "TikTok", acceptableAnswers: ["tiktok"] } },
      {
        orderIndex: 19,
        type: "multiple_choice",
        prompt: "What is the name of the premier superhero team in the Marvel Universe that includes Thor, Captain America, Iron Man, and Hulk?",
        points: 1,
        answerConfig: {
          type: "multiple_choice",
          options: [
            { id: "a", label: "A", text: "Justice League" },
            { id: "b", label: "B", text: "The Avengers" },
            { id: "c", label: "C", text: "X-Men" },
            { id: "d", label: "D", text: "Guardians of the Galaxy" }
          ],
          correctOptionId: "b"
        }
      },
      { orderIndex: 20, type: "standard", prompt: "In the Star Wars space opera franchise, what is the name of Han Solo's loyal Wookiee co-pilot?", points: 1, answerConfig: { type: "standard", answer: "Chewbacca", acceptableAnswers: ["chewbacca", "chewie"] } }
    ];

    // Helper to insert questions
    const insertQuestions = async (roundId: string, qList: any[]) => {
      for (const q of qList) {
        await db.insert(questions).values({
          id: crypto.randomUUID(),
          roundId,
          orderIndex: q.orderIndex,
          type: q.type,
          prompt: q.prompt,
          points: q.points,
          answerConfig: q.answerConfig,
          createdAt: now,
          updatedAt: now,
        });
      }
    };

    console.log("Seeding Round 1 questions...");
    await insertQuestions(round1Id, round1Questions);

    console.log("Seeding Round 2 questions...");
    await insertQuestions(round2Id, round2Questions);

    console.log("Seeding Round 3 questions...");
    await insertQuestions(round3Id, round3Questions);

    console.log("-----------------------------------------");
    console.log("Demo quiz created successfully!");
    console.log("Trivia Night ID:", triviaNightId);
    console.log("Edit Token (Raw):", rawEditToken);
    console.log("Presentation Token (Raw):", rawPresentToken);
    console.log("-----------------------------------------");
    console.log("Access URLs (assuming local dev server runs on port 3000):");
    console.log(`Edit link: http://localhost:3000/?id=${triviaNightId}&editToken=${rawEditToken}`);
    console.log(`Present link: http://localhost:3000/?id=${triviaNightId}&presentToken=${rawPresentToken}`);
    console.log("-----------------------------------------");
  } catch (error) {
    console.error("Failed to create demo quiz:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createDemoQuiz();
