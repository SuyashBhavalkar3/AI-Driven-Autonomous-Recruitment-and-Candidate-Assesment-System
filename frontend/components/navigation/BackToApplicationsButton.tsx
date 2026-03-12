"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BackToApplicationsButtonProps {
  className?: string;
  variant?: "default" | "outline" | "ghost";
}

export default function BackToApplicationsButton({
  className,
  variant = "outline",
}: BackToApplicationsButtonProps) {
  return (
    <Link href="/candidate/applications">
      <Button
        variant={variant}
        className={cn(
          "border-[#D6CDC2] text-[#4A443C] hover:bg-[#F1E9E0] dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800",
          className
        )}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Applications
      </Button>
    </Link>
  );
}
