"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";

interface Question {
  id: number;
  type: "mcq" | "coding";
  title: string;
  description: string;
  points: number;
  options?: string[];
  category?: string;
  difficulty?: string;
}

interface MCQQuestionProps {
  question: Question;
  selectedAnswer?: number;
  onAnswerChange: (answer: number) => void;
  disabled?: boolean;
}

export function MCQQuestion({ 
  question, 
  selectedAnswer, 
  onAnswerChange, 
  disabled = false 
}: MCQQuestionProps) {
  const [hoveredOption, setHoveredOption] = useState<number | null>(null);

  const handleOptionClick = (index: number) => {
    if (disabled) return;
    onAnswerChange(index);
  };

  return (
    <div className="space-y-6">
      {/* Question Description */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <p className="text-[#2D2A24] dark:text-white text-lg leading-relaxed">
          {question.description}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {question.options?.map((option, index) => {
          const isSelected = selectedAnswer === index;
          const isHovered = hoveredOption === index;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: disabled ? 1 : 1.02 }}
              whileTap={{ scale: disabled ? 1 : 0.98 }}
            >
              <Card 
                className={`p-4 cursor-pointer transition-all duration-200 border-2 ${
                  isSelected 
                    ? "border-[#B8915C] bg-[#B8915C]/10 shadow-md" 
                    : isHovered && !disabled
                    ? "border-[#B8915C]/50 bg-[#B8915C]/5 shadow-sm"
                    : "border-[#D6CDC2] hover:border-[#B8915C]/30"
                } ${disabled ? "opacity-50 cursor-not-allowed" : "hover:shadow-md"}`}
                onClick={() => handleOptionClick(index)}
                onMouseEnter={() => !disabled && setHoveredOption(index)}
                onMouseLeave={() => setHoveredOption(null)}
              >
                <div className="flex items-center space-x-4">
                  {/* Custom Radio Button */}
                  <div className={`relative w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
                    isSelected 
                      ? "border-[#B8915C] bg-[#B8915C]" 
                      : "border-[#A69A8C] bg-white dark:bg-slate-800"
                  }`}>
                    {isSelected && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      >
                        <CheckCircle className="h-3 w-3 text-white fill-current" />
                      </motion.div>
                    )}
                  </div>
                  
                  {/* Option Label and Text */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold text-lg ${
                        isSelected ? "text-[#B8915C]" : "text-[#A69A8C]"
                      }`}>
                        {String.fromCharCode(65 + index)}.
                      </span>
                      <span className={`text-base leading-relaxed ${
                        isSelected 
                          ? "text-[#2D2A24] dark:text-white font-medium" 
                          : "text-[#5A534A] dark:text-slate-300"
                      }`}>
                        {option}
                      </span>
                    </div>
                  </div>
                  
                  {/* Selection Indicator */}
                  {isSelected && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                      className="text-[#B8915C]"
                    >
                      <CheckCircle className="h-5 w-5" />
                    </motion.div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Selection Feedback */}
      {selectedAnswer !== undefined && !disabled && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 p-3 bg-[#B8915C]/10 border border-[#B8915C]/20 rounded-lg"
        >
          <CheckCircle className="h-4 w-4 text-[#B8915C]" />
          <span className="text-sm font-medium text-[#B8915C]">
            Selected: Option {String.fromCharCode(65 + selectedAnswer)} - {question.options?.[selectedAnswer]}
          </span>
        </motion.div>
      )}

      {disabled && (
        <div className="text-center py-4">
          <p className="text-red-500 text-sm font-medium">
            Assessment has been terminated due to proctoring violations.
          </p>
        </div>
      )}
    </div>
  );
}