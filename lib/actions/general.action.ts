'use server';

import { db } from "@/firebase/admin";
import OpenAI from "openai";

// Initialize OpenAI client
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// ---------------------------------------------
// GET INTERVIEWS BY USER ID
// ---------------------------------------------
export async function getInterviewsByUserId(
  userId: string
): Promise<Interview[] | null> {
  const interviews = await db
    .collection("interviews")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// ---------------------------------------------
// GET LATEST INTERVIEWS
// ---------------------------------------------
export async function getLatestInterviews(
  params: GetLatestInterviewsParams
): Promise<Interview[] | null> {
  const { userId, limit = 20 } = params;

  const interviews = await db
    .collection("interviews")
    .orderBy("createdAt", "desc")
    .where("finalized", "==", true)
    .where("userId", "!=", userId)
    .limit(limit)
    .get();

  return interviews.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Interview[];
}

// ---------------------------------------------
// GET INTERVIEW BY ID
// ---------------------------------------------
export async function getInterviewById(
  id: string
): Promise<Interview | null> {
  const interview = await db.collection("interviews").doc(id).get();
  return interview.data() as Interview | null;
}

// ---------------------------------------------
// CREATE FEEDBACK (OPENAI)
// ---------------------------------------------
export async function createFeedback(params: CreateFeedbackParams) {
  const { interviewId, userId, transcript } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (sentence: { role: string; content: string }) =>
          `- ${sentence.role}: ${sentence.content}`
      )
      .join("\n");

    const prompt = `
You are an AI interviewer analyzing a mock interview.
Evaluate the candidate strictly. Do not be lenient.

Transcript:
${formattedTranscript}

Score the candidate from 0 to 100 in these categories:
- Communication Skills
- Technical Knowledge
- Problem-Solving
- Cultural & Role Fit
- Confidence & Clarity

Return ONLY valid JSON in this format:
{
  "totalScore": number,
  "categoryScores": {
    "communication": number,
    "technical": number,
    "problemSolving": number,
    "cultureFit": number,
    "confidence": number
  },
  "strengths": string[],
  "areasForImprovement": string[],
  "finalAssessment": string
}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are a professional interviewer analyzing a mock interview.",
        },
        { role: "user", content: prompt },
      ],
    });

    const rawText = response.choices[0].message?.content ?? "";

    let parsed;
    try {
      const cleaned = rawText
        .replace(/^```json/i, "")
        .replace(/```$/, "")
        .trim();

      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Invalid JSON from OpenAI:", rawText);
      throw new Error("OpenAI returned invalid JSON");
    }

    const feedback = {
      interviewId,
      userId,
      totalScore: parsed.totalScore,
      categoryScores: parsed.categoryScores,
      strengths: parsed.strengths,
      areasForImprovement: parsed.areasForImprovement,
      finalAssessment: parsed.finalAssessment,
      createdAt: new Date().toISOString(),
    };

    const docRef = await db.collection("feedback").add(feedback);

    return { success: true, feedbackId: docRef.id };
  } catch (error) {
    console.error("Error creating feedback:", error);
    return { success: false };
  }
}

// ---------------------------------------------
// GET FEEDBACK BY INTERVIEW ID
// ---------------------------------------------
export async function getFeedbackByInterviewId(
  params: GetFeedbackByInterviewIdParams
): Promise<Feedback | null> {
  const { interviewId, userId } = params;

  const snapshot = await db
    .collection("feedback")
    .where("interviewId", "==", interviewId)
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  return { id: doc.id, ...doc.data() } as Feedback;
}
