"use client";

import InterviewAccessCheck from "@/components/interview/InterviewAccessCheck";

export default function InterviewPage() {
  return (
    <InterviewAccessCheck>
      <div className="min-h-screen flex items-center justify-center">
        <p>Loading interview...</p>
      </div>
    </InterviewAccessCheck>
  );
}