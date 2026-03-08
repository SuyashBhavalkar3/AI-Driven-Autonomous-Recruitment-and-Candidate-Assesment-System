"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Send, Loader2 } from "lucide-react";
import {
  ConversationMessage,
  InterviewContext,
} from "@/services/conversationStateManager";

interface ConversationPanelProps {
  messages: ConversationMessage[];
  context: InterviewContext;
  onSendMessage: (message: string) => void;
  isWaitingForResponse: boolean;
  isAISpeaking?: boolean;
}

export default function ConversationPanel({
  messages,
  context,
  onSendMessage,
  isWaitingForResponse,
  isAISpeaking,
}: ConversationPanelProps) {
  const [input, setInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!input.trim() || isWaitingForResponse) return;

    onSendMessage(input);
    setInput("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStateLabel = () => {
    const stateLabels: Record<string, string> = {
      greeting: "Starting Interview",
      introduction: "Introduction",
      ready_confirmation: "Checking Readiness",
      technical_question: "Technical Question",
      candidate_answer_awaiting: "Waiting for your answer",
      evaluating_answer: "Evaluating your answer",
      follow_up_question: "Follow-up Question",
      coding_question: "Coding Challenge",
      candidate_coding_awaiting: "Waiting for your solution",
      evaluating_code: "Evaluating your code",
      behavioral_question: "Behavioral Question",
      candidate_behavioral_awaiting: "Waiting for your response",
      evaluating_behavioral: "Evaluating your response",
      hint_or_clarification: "Providing hint",
      next_question_decision: "Preparing next question",
      interview_complete: "Interview Complete",
      interview_closed: "Interview Closed",
    };
    return stateLabels[context.currentState] || context.currentState;
  };

  return (
    <Card className="flex flex-col h-full bg-white dark:bg-slate-900">
      {/* Header */}
      <CardHeader className="pb-2 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <CardTitle className="text-sm">Interview Chat</CardTitle>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Position:
                </span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {context.position}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Questions: {context.questionsAsked}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-600 dark:text-slate-400">
                  Score: {context.score}%
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-600 dark:text-slate-400 mb-1">
              {getStateLabel()}
            </div>
            {isAISpeaking && (
              <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                <span className="flex h-2 w-2">
                  <span className="animate-pulse h-2 w-2 rounded-full bg-green-600 dark:bg-green-400" />
                </span>
                AI Speaking
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Messages Container */}
      <CardContent
        ref={containerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${
              msg.role === "candidate" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg text-sm ${
                msg.role === "candidate"
                  ? "bg-blue-600 text-white"
                  : msg.role === "system"
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 italic text-xs"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              <div
                className={`text-xs mt-1 ${
                  msg.role === "candidate"
                    ? "text-blue-100"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                {formatTimestamp(msg.timestamp)}
              </div>

              {/* Execution Result Display */}
              {msg.metadata?.executionResult && (
                <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600 text-xs">
                  <p className="font-semibold mb-1">Execution Result:</p>
                  <pre className="bg-slate-900 text-slate-50 p-2 rounded text-xs overflow-auto max-w-xs">
                    {msg.metadata.executionResult.output ||
                      msg.metadata.executionResult.error ||
                      "(No output)"}
                  </pre>
                </div>
              )}
            </div>
          </div>
        ))}

        {isWaitingForResponse && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-slate-600 dark:text-slate-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">
                AI is thinking...
              </span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {/* Input Section */}
      <div className="border-t border-slate-200 dark:border-slate-700 p-4 space-y-3">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={
            isWaitingForResponse
              ? "Wait for AI response..."
              : "Type your answer here..."
          }
          disabled={isWaitingForResponse}
          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400"
          rows={3}
        />
        <Button
          onClick={handleSendMessage}
          disabled={!input.trim() || isWaitingForResponse}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400"
        >
          <Send className="h-4 w-4 mr-2" />
          {isWaitingForResponse ? "Waiting..." : "Send"}
        </Button>
      </div>
    </Card>
  );
}
