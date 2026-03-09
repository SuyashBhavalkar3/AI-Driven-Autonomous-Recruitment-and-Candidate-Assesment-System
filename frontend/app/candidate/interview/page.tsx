"use client";

import { useSearchParams } from "next/navigation";
import DynamicInterviewLayout from "@/components/interview/DynamicInterviewLayout";

export default function InterviewPage() {
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