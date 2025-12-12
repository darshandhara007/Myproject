// import { generateText } from "ai";
// import { google } from "@ai-sdk/google";

// import { db } from "@/firebase/admin";
// import { getRandomInterviewCover } from "@/lib/utils";

// export async function POST(request: Request) {
//   const { type, role, level, techstack, amount, userid } = await request.json();

//   try {
//     const { text: questions } = await generateText({
//       model: google("gemini-2.0-flash-001"),
//       prompt: `Prepare questions for a job interview.
//         The job role is ${role}.
//         The job experience level is ${level}.
//         The tech stack used in the job is: ${techstack}.
//         The focus between behavioural and technical questions should lean towards: ${type}.
//         The amount of questions required is: ${amount}.
//         Please return only the questions, without any additional text.
//         The questions are going to be read by a voice assistant so do not use "/" or "*" or any other special characters which might break the voice assistant.
//         Return the questions formatted like this:
//         ["Question 1", "Question 2", "Question 3"]
        
//         Thank you! <3
//     `,
//     });

//     const interview = {
//       role: role,
//       type: type,
//       level: level,
//       techstack: techstack.split(","),
//       questions: JSON.parse(questions),
//       userId: userid,
//       finalized: true,
//       coverImage: getRandomInterviewCover(),
//       createdAt: new Date().toISOString(),
//     };

//     await db.collection("interviews").add(interview);

//     return Response.json({ success: true }, { status: 200 });
//   } catch (error) {
//     console.error("Error:", error);
//     return Response.json({ success: false, error: error }, { status: 500 });
//   }
// }

// export async function GET() {
//   return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
// }

import { NextRequest } from "next/server";
import OpenAI from "openai";
import { db } from "@/firebase/admin";
import { getRandomInterviewCover } from "@/lib/utils";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function GET() {
  return Response.json({ success: true, data: "THANK YOU!" }, { status: 200 });
}

export async function POST(request: Request) {
  const { type, role, level, techstack, amount, userid } = await request.json();

  if (!role || !type || !level || !userid) {
    return Response.json(
      {
        success: false,
        error: { message: "role, type, level, and userid are required." },
      },
      { status: 400 }
    );
  }

  const prompt = `
Generate ONLY a valid JSON array of ${amount} interview questions.
NO explanation. NO additional text.

Role: ${role}
Level: ${level}
Type: ${type}
Techstack: ${techstack}

Return STRICT JSON like:
["Question 1", "Question 2", "Question 3"]
`;

  try {
    // 🔥 Call OpenAI
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini", // Reliable, cheap, perfect for this use case
      messages: [{ role: "user", content: prompt }],
      temperature: 0.2,
    });

    const text = response.choices[0].message?.content ?? "";

    // --- SAFE JSON PARSING ---
    let questions = [];
    try {
      const cleaned = text
        .trim()
        .replace(/^json\s*/i, "")
        .replace(/$/, "")
        .trim();

      questions = JSON.parse(cleaned);
      if (!Array.isArray(questions)) {
        throw new Error("Not an array");
      }
    } catch (err) {
      console.error("❌ Invalid JSON from OpenAI:", text);
      return Response.json(
        {
          success: false,
          error: { message: "OpenAI did not return valid JSON", raw: text },
        },
        { status: 500 }
      );
    }

    // Save interview
    const interview = {
      role,
      type,
      level,
      techstack: techstack.split(","),
      questions,
      userId: userid,
      finalized: true,
      coverImage: getRandomInterviewCover(),
      createdAt: new Date().toISOString(),
    };

    await db.collection("interviews").add(interview);

    return Response.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error("🔥 SERVER ERROR:", error);
    return Response.json(
      {
        success: false,
        error: { message: error?.message },
      },
      { status: 500 }
    );
  }
}