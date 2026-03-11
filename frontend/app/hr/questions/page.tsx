"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  AlertCircle,
} from "lucide-react";
import { getAuthToken, getUserRole } from "@/lib/auth";

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

// Difficulty badge colors (beige palette)
const difficultyColors = {
  Easy: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
  Medium: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  Hard: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0",
};

// Type badge colors (beige palette)
const typeColors = {
  coding: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 border-0",
  mcq: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-0",
  text: "bg-stone-100 text-stone-700 dark:bg-stone-900/30 dark:text-stone-300 border-0",
  oral: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 border-0",
};

export default function QuestionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
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

  // Check authentication and role
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = getAuthToken();
        if (!token) {
          router.push("/login");
          return;
        }

        const role = getUserRole();
        if (role !== "hr") {
          setError("You don't have permission to view this page.");
          setLoading(false);
          return;
        }

        setLoading(false);
      } catch (error) {
        console.error('Authentication check failed:', error);
        setError("Authentication failed.");
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-stone-600 dark:text-stone-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-stone-100 dark:from-stone-950 dark:to-stone-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-semibold text-stone-900 dark:text-white flex items-center gap-2">
              Question Bank
              <Sparkles className="h-5 w-5 text-amber-500" />
            </h1>
            <p className="text-stone-500 dark:text-stone-400 mt-1">
              Manage assessment and interview questions
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Tabs defaultValue="assessment" className="space-y-6">
          <TabsList className="bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm border border-stone-200 dark:border-stone-800">
            <TabsTrigger
              value="assessment"
              className="data-[state=active]:bg-amber-50 dark:data-[state=active]:bg-amber-950/50 data-[state=active]:text-amber-700 dark:data-[state=active]:text-amber-300"
            >
              Assessment Questions
            </TabsTrigger>
            <TabsTrigger
              value="interview"
              className="data-[state=active]:bg-stone-50 dark:data-[state=active]:bg-stone-950/50 data-[state=active]:text-stone-700 dark:data-[state=active]:text-stone-300"
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
                className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg shadow-amber-500/20 hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {assessmentQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm"
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
                          <Badge variant="outline" className="border-stone-200 dark:border-stone-700">
                            <Award className="h-3 w-3 mr-1 text-amber-500" />
                            {q.points} pts
                          </Badge>
                        </div>
                        <h3 className="font-medium text-stone-900 dark:text-white">
                          {q.title}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-stone-500 hover:text-amber-600 dark:text-stone-400 dark:hover:text-amber-400"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400"
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
                className="bg-gradient-to-r from-stone-600 to-stone-500 hover:from-stone-700 hover:to-stone-600 text-white shadow-lg shadow-stone-500/20 hover:shadow-xl transition-all duration-300"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Question
              </Button>
            </div>

            <div className="space-y-3">
              {interviewQuestions.map((q) => (
                <Card
                  key={q.id}
                  className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm"
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
                          <Badge variant="outline" className="border-stone-200 dark:border-stone-700">
                            <Clock className="h-3 w-3 mr-1 text-amber-500" />
                            {Math.floor(q.duration / 60)} min
                          </Badge>
                        </div>
                        <h3 className="font-medium text-stone-900 dark:text-white">
                          {q.question}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-stone-500 hover:text-stone-600 dark:text-stone-400 dark:hover:text-stone-300"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-stone-500 hover:text-rose-600 dark:text-stone-400 dark:hover:text-rose-400"
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
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/95 dark:bg-stone-900/95 backdrop-blur-xl border-0 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-semibold bg-gradient-to-r from-amber-600 to-stone-600 bg-clip-text text-transparent">
                Add {questionType === "assessment" ? "Assessment" : "Interview"} Question
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-5 mt-4">
              <div className="space-y-2">
                <Label htmlFor="type" className="text-stone-700 dark:text-stone-300">
                  Question Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger
                    id="type"
                    className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
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
                <Label htmlFor="title" className="text-stone-700 dark:text-stone-300">
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
                  className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-stone-700 dark:text-stone-300">
                  Description (optional)
                </Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Provide additional context or instructions..."
                  rows={3}
                  className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                />
              </div>

              {questionType === "assessment" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="difficulty" className="text-stone-700 dark:text-stone-300">
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
                        className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
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
                    <Label htmlFor="points" className="text-stone-700 dark:text-stone-300">
                      Points
                    </Label>
                    <Input
                      id="points"
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      placeholder="e.g., 30"
                      className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>
                </div>
              )}

              {questionType === "interview" && (
                <div className="space-y-2">
                  <Label htmlFor="duration" className="text-stone-700 dark:text-stone-300">
                    Duration (seconds)
                  </Label>
                  <Input
                    id="duration"
                    type="number"
                    value={formData.duration}
                    onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                    placeholder="e.g., 120"
                    className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              )}

              {formData.type === "mcq" && (
                <div className="space-y-2">
                  <Label htmlFor="options" className="text-stone-700 dark:text-stone-300">
                    Options (comma-separated)
                  </Label>
                  <Input
                    id="options"
                    value={formData.options}
                    onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                    placeholder="Option 1, Option 2, Option 3, Option 4"
                    className="border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              )}

              {formData.type === "coding" && (
                <div className="space-y-2">
                  <Label htmlFor="starterCode" className="text-stone-700 dark:text-stone-300">
                    Starter Code (optional)
                  </Label>
                  <Textarea
                    id="starterCode"
                    value={formData.starterCode}
                    onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                    placeholder="function example() {&#10;  // Your code here&#10;}"
                    rows={5}
                    className="font-mono text-sm border-stone-200 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white shadow-lg"
                >
                  Add Question
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowDialog(false)}
                  className="border-stone-200 dark:border-stone-700 hover:bg-stone-100 dark:hover:bg-stone-800"
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