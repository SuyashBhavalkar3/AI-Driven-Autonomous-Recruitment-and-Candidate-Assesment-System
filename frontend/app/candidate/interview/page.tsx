"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import DynamicInterviewLayout from "@/components/interview/DynamicInterviewLayout";

function InterviewContent() {
  const searchParams = useSearchParams();
  const applicationId = searchParams.get("applicationId") || "test";
  const company = searchParams.get("company") || "Tech Company";
  const position = searchParams.get("position") || "Software Engineer";

  return (
    <DynamicInterviewLayout
      applicationId={applicationId}
      company={company}
      position={position}
    />
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading interview...</div>}>
      <InterviewContent />
    </Suspense>
  );
}
