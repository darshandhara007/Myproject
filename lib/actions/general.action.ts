'use server';

import {db} from "@/firebase/admin";
import {generateObject} from "ai";
// import {google} from "@ai-sdk/google";
import {feedbackSchema} from "@/constants";
import { openai } from "@ai-sdk/openai";

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
    const { interviewId, userId, transcript } = params;

    try {
        const formattedTranscript = transcript.map((sentence: { role: string, content: string }) => (
            `- ${sentence.role}: ${sentence.content}\n`
        )).join('');

        const { object } = await generateObject({
            model: google('gemini-2.0-flash-001', {
                structuredOutputs: false,
            }),
        
            schema: feedbackSchema,
            prompt: `
        You are an AI interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories. Be thorough and detailed in your analysis. Don't be lenient with the candidate. If there are mistakes or areas for improvement, point them out.
        Transcript:
        ${formattedTranscript}

        Please score the candidate from 0 to 100 in the following areas. Do not add categories other than the ones provided:
        - **Communication Skills**: Clarity, articulation, structured responses.
        - **Technical Knowledge**: Understanding of key concepts for the role.
        - **Problem-Solving**: Ability to analyze problems and propose solutions.
        - **Cultural & Role Fit**: Alignment with company values and job role.
        - **Confidence & Clarity**: Confidence in responses, engagement, and clarity.
        `,
            system:
        "You are a professional interviewer analyzing a mock interview. Your task is to evaluate the candidate based on structured categories",
        });

        const feedback = {
            interviewId,
            userId,
            totalScore: object.totalScore,
            categoryScores: object.categoryScores,
            strengths: object.strengths,
            areasForImprovement: object. areasForImprovement,
            finalAssessment: object.finalAssessment,
            createdAt: new Date().toISOString()
        }

        const newFeedback = await db.collection('feedback')
            .add(feedback)

        return { success: true, feedbackId: newFeedback.id };
    } catch (e) {
        console.log('Error saving feedback', e)

        return { success: false }
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

    if(feedback.empty) return null;
    const feedbackDoc = feedback.docs[0];

    return { id: feedbackDoc.id, ...feedbackDoc.data()} as Feedback;
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




