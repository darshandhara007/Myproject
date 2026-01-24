<<<<<<< HEAD

=======
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
    getFeedbackByInterviewId,
    getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";

<<<<<<< HEAD
const Feedback = async ({ params }: RouteParams) => {
=======
const Page = async ({ params }: RouteParams) => {
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
    const { id } = await params;
    const user = await getCurrentUser();

    const interview = await getInterviewById(id);
<<<<<<< HEAD
    if (!interview) redirect("/");
=======
    if(!interview) redirect('/');
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b

    const feedback = await getFeedbackByInterviewId({
        interviewId: id,
        userId: user?.id!,
<<<<<<< HEAD
    });

    // Convert categoryScores object into array
    const categoryScoresArray = feedback?.categoryScores
        ? Object.entries(feedback.categoryScores).map(([name, score]) => ({
              name,
              score,
          }))
        : [];
=======
    })

    console.log(feedback);
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b

    return (
        <section className="section-feedback">
            <div className="flex flex-row justify-center">
                <h1 className="text-4xl font-semibold">
                    Feedback on the Interview -{" "}
                    <span className="capitalize">{interview.role}</span> Interview
                </h1>
            </div>

            <div className="flex flex-row justify-center">
                <div className="flex flex-row gap-5">
<<<<<<< HEAD
                    {/* Overall Impression */}
=======
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
                    <div className="flex flex-row gap-2 items-center">
                        <Image src="/star.svg" width={22} height={22} alt="star" />
                        <p>
                            Overall Impression:{" "}
                            <span className="text-primary-200 font-bold">
<<<<<<< HEAD
                                {feedback?.totalScore}
                            </span>
=======
                {feedback?.totalScore}
              </span>
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
                            /100
                        </p>
                    </div>

<<<<<<< HEAD
                    {/* Date */}
=======
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
                    <div className="flex flex-row gap-2">
                        <Image src="/calendar.svg" width={22} height={22} alt="calendar" />
                        <p>
                            {feedback?.createdAt
                                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                                : "N/A"}
                        </p>
                    </div>
                </div>
            </div>

            <hr />

            <p>{feedback?.finalAssessment}</p>

<<<<<<< HEAD
            {/* Interview Breakdown */}
            <div className="flex flex-col gap-4">
                <h2>Breakdown of the Interview:</h2>
                {categoryScoresArray.map((category, index) => (
=======
            <div className="flex flex-col gap-4">
                <h2>Breakdown of the Interview:</h2>
                {feedback?.categoryScores?.map((category, index) => (
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
                    <div key={index}>
                        <p className="font-bold">
                            {index + 1}. {category.name} ({category.score}/100)
                        </p>
<<<<<<< HEAD
=======
                        <p>{category.comment}</p>
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
                    </div>
                ))}
            </div>

            <div className="flex flex-col gap-3">
                <h3>Strengths</h3>
                <ul>
                    {feedback?.strengths?.map((strength, index) => (
                        <li key={index}>{strength}</li>
                    ))}
                </ul>
            </div>

            <div className="flex flex-col gap-3">
                <h3>Areas for Improvement</h3>
                <ul>
                    {feedback?.areasForImprovement?.map((area, index) => (
                        <li key={index}>{area}</li>
                    ))}
                </ul>
            </div>

            <div className="buttons">
                <Button className="btn-secondary flex-1">
                    <Link href="/" className="flex w-full justify-center">
                        <p className="text-sm font-semibold text-primary-200 text-center">
                            Back to dashboard
                        </p>
                    </Link>
                </Button>

                <Button className="btn-primary flex-1">
                    <Link
                        href={`/interview/${id}`}
                        className="flex w-full justify-center"
                    >
                        <p className="text-sm font-semibold text-black text-center">
                            Retake Interview
                        </p>
                    </Link>
                </Button>
            </div>
        </section>
<<<<<<< HEAD
    );
};

export default Feedback;

=======
    )
}
export default Page
>>>>>>> 6a1c48aa1868c7f01b62542f1e0e903cc913da4b
