'use server';

import { db } from "@/firebase/admin";
import { generateObject } from "ai";
// import {google} from "@ai-sdk/google";
import { feedbackSchema } from "@/constants";
import { openai } from "@ai-sdk/openai";
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function getInterviewsByUserId(userId: string): Promise<Interview[] | null> {
    const interviews = await db
        .collection('interviews')
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getLatestInterviews(params: GetLatestInterviewsParams): Promise<Interview[] | null> {
    const { userId, limit = 20 } = params;

    const interviews = await db
        .collection('interviews')
        .orderBy('createdAt', 'desc')
        .where('finalized', '==', true)
        .where('userId', '!=', userId)
        .limit(limit)
        .get();

    return interviews.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
    })) as Interview[];
}

export async function getInterviewById(id: string): Promise<Interview | null> {
    const interview = await db
        .collection('interviews')
        .doc(id)
        .get();

    return interview.data() as Interview | null;
}
export async function createFeedback(params: CreateFeedbackParams) {
  console.log("in the function")
  const { interviewId, userId, transcript, feedbackId } = params;

  try {
    const formattedTranscript = transcript
      .map(
        (s: { role: string; content: string }) =>
          `- ${s.role}: ${s.content}`
      )
      .join("\n");

    const prompt = `
You are a professional interviewer analyzing a mock interview.

Analyze the candidate STRICTLY and return ONLY valid JSON.
Do not add explanations or markdown.

Transcript:
${formattedTranscript}

Return JSON in this exact format:
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

    // 🔥 OpenAI call (same style as your POST API)
    const response = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const rawText = response.choices[0].message?.content ?? "";

    // 🔍 Safe JSON parse
    let parsed;
    try {
      const cleaned = rawText
        .trim()
        .replace(/^```json\s*/i, "")
        .replace(/```$/, "")
        .trim();

      parsed = JSON.parse(cleaned);
    } catch (err) {
      console.error("❌ Invalid JSON from OpenAI:", rawText);
      throw new Error("Invalid JSON returned from OpenAI");
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

    console.log(feedback);

    const ref = feedbackId
      ? db.collection("feedback").doc(feedbackId)
      : db.collection("feedback").doc();

    await ref.set(feedback);

    return { success: true, feedbackId: ref.id };
  } catch (error) {
    console.error("🔥 Error saving feedback:", error);
    return { success: false };
  }
}




export async function getFeedbackByInterviewId(params: GetFeedbackByInterviewIdParams): Promise<Feedback | null> {
    const { interviewId, userId } = params;

    const feedback = await db
        .collection('feedback')
        .where('interviewId', '==', interviewId)
        .where('userId', '==', userId)
        .limit(1)
        .get();

    if (feedback.empty) return null;
    const feedbackDoc = feedback.docs[0];

    return { id: feedbackDoc.id, ...feedbackDoc.data() } as Feedback;
}








// 'use server';

// import { db } from "@/firebase/admin";
// import { generateObject } from "ai";
// import { openai } from "@ai-sdk/openai";
// import { feedbackSchema } from "@/constants";

// /* ---------------------------------------------
//    CREATE FEEDBACK (OPENAI)
// ---------------------------------------------- */
// export async function createFeedback(params: CreateFeedbackParams) {
//   const { interviewId, userId, transcript } = params;

//   try {
//     const formattedTranscript = transcript
//       .map(
//         (sentence: { role: string; content: string }) =>
//           `- ${sentence.role}: ${sentence.content}`
//       )
//       .join("\n");

//     const { object } = await generateObject({
//       model: openai("gpt-4o-mini"),
//       schema: feedbackSchema,
//       system: "You are a professional interviewer analyzing a mock interview.",
//       prompt: `
// You are an AI interviewer analyzing a mock interview.
// Be strict and detailed. Highlight mistakes and areas for improvement.

// Transcript:
// ${formattedTranscript}

// Score the candidate from 0 to 100 in the following categories:
// - Communication Skills
// - Technical Knowledge
// - Problem Solving
// - Cultural Fit
// - Confidence and Clarity

// Return the response strictly in the provided schema.
// `,
//     });

//     const feedback = {
//       interviewId,
//       userId,
//       totalScore: object.totalScore,
//       categoryScores: object.categoryScores,
//       strengths: object.strengths,
//       areasForImprovement: object.areasForImprovement,
//       finalAssessment: object.finalAssessment,
//       createdAt: new Date().toISOString(),
//     };

//     const doc = await db.collection("feedback").add(feedback);

//     return { success: true, feedbackId: doc.id };
//   } catch (error) {
//     console.error("❌ Error creating feedback:", error);
//     return { success: false };
//   }
// }

// /* ---------------------------------------------
//    GET FEEDBACK BY INTERVIEW ID
// ---------------------------------------------- */
// export async function getFeedbackByInterviewId(
//   params: GetFeedbackByInterviewIdParams
// ): Promise<Feedback | null> {
//   const { interviewId, userId } = params;

//   const snapshot = await db
//     .collection("feedback")
//     .where("interviewId", "==", interviewId)
//     .where("userId", "==", userId)
//     .limit(1)
//     .get();

//   if (snapshot.empty) return null;

//   const doc = snapshot.docs[0];

//   return {
//     id: doc.id,
//     ...doc.data(),
//   } as Feedback;
// }




