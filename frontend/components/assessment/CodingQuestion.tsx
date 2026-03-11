"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Code, 
  Play, 
  RotateCcw, 
  Copy, 
  Check,
  AlertCircle,
  Loader2,
  Terminal,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Question {
  id: number;
  type: "mcq" | "coding";
  title: string;
  description: string;
  points: number;
  starter_code?: string;
  category?: string;
  difficulty?: string;
}

interface CodingQuestionProps {
  question: Question;
  code: string;
  onCodeChange: (code: string) => void;
  disabled?: boolean;
}

interface ExecutionResult {
  success: boolean;
  output?: string;
  error?: string;
  executionTime?: number;
}

export function CodingQuestion({ 
  question, 
  code, 
  onCodeChange, 
  disabled = false 
}: CodingQuestionProps) {
  const [copied, setCopied] = useState(false);
  const [lineCount, setLineCount] = useState(1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  // Update line count when code changes
  useEffect(() => {
    const lines = code.split('\n').length;
    setLineCount(lines);
  }, [code]);

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (disabled) return;
    onCodeChange(e.target.value);
  };

  const handleReset = () => {
    if (disabled) return;
    onCodeChange(question.starter_code || "");
    setExecutionResult(null);
    setShowOutput(false);
  };

  const handleCopyStarter = async () => {
    if (disabled || !question.starter_code) return;
    
    try {
      await navigator.clipboard.writeText(question.starter_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  // Execute code using Doodle API or similar service
  const executeCode = async () => {
    if (disabled || !code.trim()) return;
    
    setIsExecuting(true);
    setExecutionResult(null);
    setShowOutput(true);
    
    try {
      // Using a public code execution API (you can replace with Doodle API)
      const response = await fetch('https://api.codex.jaagrav.in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: code,
          language: 'python', // Default to Python, can be made dynamic
          input: '' // Can be enhanced to accept input
        })
      });
      
      if (!response.ok) {
        throw new Error('Execution failed');
      }
      
      const result = await response.json();
      
      setExecutionResult({
        success: !result.error,
        output: result.output || result.stdout,
        error: result.error || result.stderr,
        executionTime: result.executionTime
      });
    } catch (error) {
      setExecutionResult({
        success: false,
        error: 'Failed to execute code. Please check your internet connection.',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  // Generate line numbers
  const lineNumbers = Array.from({ length: Math.max(lineCount, 10) }, (_, i) => i + 1);

  return (
    <div className="space-y-6">
      {/* Question Description */}
      <div className="prose prose-slate dark:prose-invert max-w-none">
        <div className="text-[#2D2A24] dark:text-white text-base leading-relaxed whitespace-pre-wrap">
          {question.description}
        </div>
      </div>

      {/* Difficulty and Category */}
      <div className="flex items-center gap-2">
        {question.difficulty && (
          <Badge 
            variant="outline" 
            className={`${
              question.difficulty === "Easy" 
                ? "border-green-500 text-green-600" 
                : question.difficulty === "Medium"
                ? "border-yellow-500 text-yellow-600"
                : "border-red-500 text-red-600"
            }`}
          >
            {question.difficulty}
          </Badge>
        )}
        {question.category && (
          <Badge variant="secondary">
            {question.category}
          </Badge>
        )}
      </div>

      {/* Code Editor */}
      <Card className="overflow-hidden">
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-4 w-4 text-[#B8915C]" />
            <span className="text-sm font-medium text-[#2D2A24] dark:text-white">
              Code Editor
            </span>
            <Badge variant="outline" className="text-xs">
              {code.split('\n').length} lines
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {question.starter_code && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyStarter}
                disabled={disabled}
                className="text-xs"
              >
                {copied ? (
                  <>
                    <Check className="h-3 w-3 mr-1" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3 mr-1" />
                    Copy Starter
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              disabled={disabled || !question.starter_code}
              className="text-xs"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              Reset
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={executeCode}
              disabled={disabled || !code.trim() || isExecuting}
              className="text-xs bg-green-50 hover:bg-green-100 text-green-700"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 mr-1" />
                  Run Code
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="relative">
          {/* Line Numbers */}
          <div className="absolute left-0 top-0 bottom-0 w-12 bg-slate-100 dark:bg-slate-700 border-r border-slate-200 dark:border-slate-600 flex flex-col text-xs text-slate-500 dark:text-slate-400 font-mono">
            {lineNumbers.map(num => (
              <div key={num} className="h-6 flex items-center justify-end pr-2 leading-6">
                {num}
              </div>
            ))}
          </div>

          {/* Code Textarea */}
          <Textarea
            value={code}
            onChange={handleCodeChange}
            disabled={disabled}
            placeholder={disabled ? "Assessment terminated" : "Write your code here..."}
            className={`min-h-[400px] pl-16 pr-4 py-3 font-mono text-sm leading-6 resize-none border-0 focus:ring-0 ${
              disabled ? "bg-slate-100 dark:bg-slate-800 cursor-not-allowed" : ""
            }`}
            style={{
              lineHeight: '1.5rem',
              tabSize: 2,
            }}
          />
        </div>

        {/* Code Stats */}
        <div className="bg-slate-50 dark:bg-slate-800 px-4 py-2 border-t">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-4">
              <span>Characters: {code.length}</span>
              <span>Lines: {code.split('\n').length}</span>
              <span>Words: {code.trim() ? code.trim().split(/\s+/).length : 0}</span>
            </div>
            
            {disabled && (
              <div className="flex items-center gap-1 text-red-500">
                <AlertCircle className="h-3 w-3" />
                <span>Editing disabled</span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Code Execution Output */}
      {showOutput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.3 }}
        >
          <Card className="overflow-hidden">
            <div className="bg-slate-900 text-white px-4 py-2 border-b flex items-center gap-2">
              <Terminal className="h-4 w-4" />
              <span className="text-sm font-medium">Output</span>
              {executionResult && (
                <Badge 
                  variant={executionResult.success ? "default" : "destructive"}
                  className="text-xs"
                >
                  {executionResult.success ? (
                    <><CheckCircle className="h-3 w-3 mr-1" />Success</>
                  ) : (
                    <><XCircle className="h-3 w-3 mr-1" />Error</>
                  )}
                </Badge>
              )}
            </div>
            
            <div className="bg-slate-950 text-green-400 p-4 font-mono text-sm min-h-[100px] max-h-[200px] overflow-y-auto">
              {isExecuting ? (
                <div className="flex items-center gap-2 text-yellow-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Executing code...</span>
                </div>
              ) : executionResult ? (
                <div className="space-y-2">
                  {executionResult.success ? (
                    <div>
                      <div className="text-green-400 mb-2">✓ Execution completed successfully</div>
                      {executionResult.output && (
                        <pre className="whitespace-pre-wrap text-white">
                          {executionResult.output}
                        </pre>
                      )}
                      {executionResult.executionTime && (
                        <div className="text-slate-400 text-xs mt-2">
                          Execution time: {executionResult.executionTime}ms
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="text-red-400 mb-2">✗ Execution failed</div>
                      <pre className="whitespace-pre-wrap text-red-300">
                        {executionResult.error}
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-slate-400">Click "Run Code" to execute your solution</div>
              )}
            </div>
          </Card>
        </motion.div>
      )}

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4"
      >
        <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
          Instructions:
        </h4>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Write clean, readable code with proper indentation</li>
          <li>• Add comments to explain your logic</li>
          <li>• Test your solution using the "Run Code" button</li>
          <li>• Consider edge cases and error handling</li>
          <li>• Your code will be evaluated for correctness and quality</li>
        </ul>
      </motion.div>

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