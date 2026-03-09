"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PlusCircle,
  Edit,
  Trash2,
  Code,
  MessageSquare,
  Sparkles,
  Clock,
  Award,
  HelpCircle,
} from "lucide-react";

// Sample data (in real app, this would come from an API)
const assessmentQuestions: Array<{
  id: number;
  type: "coding" | "mcq" | "text";
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  points: number;
}> = [
  {
    id: 1,
    type: "coding",
    title: "Implement a debounce function",
    difficulty: "Medium",
    points: 30,
  },
  {
    id: 2,
    type: "coding",
    title: "Binary Tree Traversal",
    difficulty: "Hard",
    points: 40,
  },
  {
    id: 3,
    type: "mcq",
    title: "React Hooks",
    difficulty: "Easy",
    points: 10,
  },
  {
    id: 4,
    type: "text",
    title: "System Design",
    difficulty: "Hard",
    points: 20,
  },
];

const interviewQuestions: Array<{
  id: number;
  type: "oral" | "coding";
  question: string;
  duration: number;
}> = [
  {
    id: 1,
    type: "oral",
    question: "Tell me about yourself",
    duration: 120,
  },
  {
    id: 2,
    type: "coding",
    question: "Find longest palindrome",
    duration: 900,
  },
  {
    id: 3,
    type: "oral",
    question: "Explain closures in JavaScript",
    duration: 180,
  },
];

// Difficulty badge colors
const difficultyColors = {
  Easy: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0",
  Medium:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  Hard: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300 border-0",
};

// Type badge colors for assessment
const typeColors = {
  coding:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border-0",
  mcq: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0",
  text: "bg-slate-100 text-slate-700 dark:bg-slate-900/30 dark:text-slate-300 border-0",
  oral: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
};

export default function QuestionsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [questionType, setQuestionType] = useState<"assessment" | "interview">(
    "assessment"
  );
  const [formData, setFormData] = useState({
    type: "coding",
    title: "",
    description: "",
    difficulty: "",
    points: "",
    duration: "",
    options: "",
    starterCode: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Question added:", formData);
    setShowDialog(false);
    setFormData({
      type: "coding",
      title: "",
      description: "",
      difficulty: "",
      points: "",
      duration: "",
      options: "",
      starterCode: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              Question Bank
              <Sparkles className="h-5 w-5 text-indigo-500" />
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
              Manage assessment and interview questions
            </p>
          </div>
        </div>

        <Tabs defaultValue="assessment" className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border border-slate-200 dark:border-slate-800">
            <TabsTrigger
              value="assessment"
              className="data-[state=active]:bg-indigo-50 dark:data-[state=active]:bg-indigo-950/50 data-[state=active]:text-indigo-700 dark:data-[state=active]:text-indigo-300"
            >
              Assessment Questions
            </TabsTrigger>
            <TabsTrigger
              value="interview"
              className="data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-300"
            >
              Interview Questions
            </TabsTrigger>
          </TabsList>

          <TabsContent value="assessment" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setQuestionType("assessment");
                  setShowDialog(true);
                }}
                className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-lg shadow-indigo-500/20 hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {assessmentQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={typeColors[q.type]}>
                            {q.type === "coding" && (
                              <Code className="h-3 w-3 mr-1" />
                            )}
                            {q.type === "mcq" && (
                              <HelpCircle className="h-3 w-3 mr-1" />
                            )}
                            {q.type === "text" && (
                              <MessageSquare className="h-3 w-3 mr-1" />
                            )}
                            {q.type.toUpperCase()}
                          </Badge>
                          <Badge className={difficultyColors[q.difficulty]}>
                            {q.difficulty}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 dark:border-slate-700">
                            <Award className="h-3 w-3 mr-1 text-amber-500" />
                            {q.points} pts
                          </Badge>
                        </div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {q.title}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interview" className="space-y-4">
            <div className="flex justify-end">
              <Button
                onClick={() => {
                  setQuestionType("interview");
                  setShowDialog(true);
                }}
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {interviewQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className={typeColors[q.type]}>
                            {q.type === "oral" ? (
                              <MessageSquare className="h-3 w-3 mr-1" />
                            ) : (
                              <Code className="h-3 w-3 mr-1" />
                            )}
                            {q.type.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className="border-slate-200 dark:border-slate-700">
                            <Clock className="h-3 w-3 mr-1 text-amber-500" />
                            {Math.floor(q.duration / 60)} min
                          </Badge>
                        </div>
                        <h3 className="font-medium text-slate-900 dark:text-white">
                          {q.question}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-amber-600 dark:text-slate-400 dark:hover:text-amber-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Question Dialog */}
        <Dialog open={showDialog} onOpenChange={setShowDialog}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-indigo-600 to-amber-600 bg-clip-text text-transparent">
                Add {questionType === "assessment" ? "Assessment" : "Interview"} Question
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-slate-700 dark:text-slate-300">
                  Question Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger
                    id="type"
                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  >
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="coding">Coding</SelectItem>
                    <SelectItem value="mcq">Multiple Choice</SelectItem>
                    <SelectItem value="text">Text Answer</SelectItem>
                    {questionType === "interview" && (
                      <SelectItem value="oral">Oral</SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="title" className="text-slate-700 dark:text-slate-300">
                  {questionType === "assessment" ? "Title" : "Question"}
                </Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={
                    questionType === "assessment"
                      ? "e.g., Implement a debounce function"
                      : "e.g., Explain closures in JavaScript"
                  }
                  required
                  className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-700 dark:text-slate-300">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional context or instructions..."
                  rows={3}
                  className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                />
              </div>

              {questionType === "assessment" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-slate-700 dark:text-slate-300">
                      Difficulty
                    </Label>
                    <Select
                      value={formData.difficulty}
                      onValueChange={(value) =>
                        setFormData({ ...formData, difficulty: value })
                      }
                    >
                      <SelectTrigger
                        id="difficulty"
                        className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                      >
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="points" className="text-slate-700 dark:text-slate-300">
                      Points
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      placeholder="e.g., 30"
                      className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                    />
                  </div>
                </div>
              )}

              {questionType === "interview" && (
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-slate-700 dark:text-slate-300">
                    Duration (seconds)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 120"
                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              )}

              {formData.type === "mcq" && (
                <div className="space-y-2">
                  <Label htmlFor="options" className="text-slate-700 dark:text-slate-300">
                    Options (comma-separated)
                  </Label>
                  <Input
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3, Option 4"
                    className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              )}

              {formData.type === "coding" && (
                <div className="space-y-2">
                  <Label htmlFor="starterCode" className="text-slate-700 dark:text-slate-300">
                    Starter Code (optional)
                  </Label>
                  <Textarea
                    id="starterCode"
                    value={formData.starterCode}
                    onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                    placeholder="function example() {&#10;  // Your code here&#10;}"
                    rows={5}
                    className="font-mono text-sm border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-700 hover:to-indigo-600 text-white shadow-lg"
                >
                  Add Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}