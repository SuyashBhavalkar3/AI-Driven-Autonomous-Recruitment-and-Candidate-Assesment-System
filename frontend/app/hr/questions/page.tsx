"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusCircle, Edit, Trash2, Code, MessageSquare } from "lucide-react";

const assessmentQuestions = [
  { id: 1, type: "coding", title: "Implement a debounce function", difficulty: "Medium", points: 30 },
  { id: 2, type: "coding", title: "Binary Tree Traversal", difficulty: "Hard", points: 40 },
  { id: 3, type: "mcq", title: "React Hooks", difficulty: "Easy", points: 10 },
  { id: 4, type: "text", title: "System Design", difficulty: "Hard", points: 20 },
];

const interviewQuestions = [
  { id: 1, type: "oral", question: "Tell me about yourself", duration: 120 },
  { id: 2, type: "coding", question: "Find longest palindrome", duration: 900 },
  { id: 3, type: "oral", question: "Explain closures in JavaScript", duration: 180 },
];

export default function QuestionsPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [questionType, setQuestionType] = useState<"assessment" | "interview">("assessment");
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
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Question Bank</h1>
        <p className="text-slate-600 dark:text-slate-400">Manage assessment and interview questions</p>
      </div>

      <Tabs defaultValue="assessment" className="space-y-6">
        <TabsList>
          <TabsTrigger value="assessment">Assessment Questions</TabsTrigger>
          <TabsTrigger value="interview">Interview Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="assessment" className="space-y-4">
          <div className="flex justify-end">
            <Button
              onClick={() => {
                setQuestionType("assessment");
                setShowDialog(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          <div className="space-y-3">
            {assessmentQuestions.map((q) => (
              <Card key={q.id} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950/30">
                          {q.type === "coding" ? <Code className="h-3 w-3 mr-1" /> : null}
                          {q.type.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">{q.difficulty}</Badge>
                        <Badge variant="secondary">{q.points} points</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{q.title}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
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
              className="bg-blue-600 hover:bg-blue-700"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          <div className="space-y-3">
            {interviewQuestions.map((q) => (
              <Card key={q.id} className="border-slate-200 dark:border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="bg-indigo-50 dark:bg-indigo-950/30">
                          {q.type === "oral" ? <MessageSquare className="h-3 w-3 mr-1" /> : <Code className="h-3 w-3 mr-1" />}
                          {q.type.toUpperCase()}
                        </Badge>
                        <Badge variant="secondary">{Math.floor(q.duration / 60)} min</Badge>
                      </div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">{q.question}</h3>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600">
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

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add {questionType === "assessment" ? "Assessment" : "Interview"} Question</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Question Type</Label>
              <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="coding">Coding</SelectItem>
                  <SelectItem value="mcq">Multiple Choice</SelectItem>
                  <SelectItem value="text">Text Answer</SelectItem>
                  {questionType === "interview" && <SelectItem value="oral">Oral</SelectItem>}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Title/Question</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter question title"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description or instructions"
                rows={3}
              />
            </div>

            {questionType === "assessment" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(value) => setFormData({ ...formData, difficulty: value })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Easy">Easy</SelectItem>
                        <SelectItem value="Medium">Medium</SelectItem>
                        <SelectItem value="Hard">Hard</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Points</Label>
                    <Input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: e.target.value })}
                      placeholder="e.g. 30"
                    />
                  </div>
                </div>
              </>
            )}

            {questionType === "interview" && (
              <div className="space-y-2">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  value={formData.duration}
                  onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                  placeholder="e.g. 120"
                />
              </div>
            )}

            {formData.type === "mcq" && (
              <div className="space-y-2">
                <Label>Options (comma-separated)</Label>
                <Input
                  value={formData.options}
                  onChange={(e) => setFormData({ ...formData, options: e.target.value })}
                  placeholder="Option 1, Option 2, Option 3, Option 4"
                />
              </div>
            )}

            {formData.type === "coding" && (
              <div className="space-y-2">
                <Label>Starter Code (Optional)</Label>
                <Textarea
                  value={formData.starterCode}
                  onChange={(e) => setFormData({ ...formData, starterCode: e.target.value })}
                  placeholder="function example() {&#10;  // Your code here&#10;}"
                  rows={5}
                  className="font-mono text-sm"
                />
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                Add Question
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowDialog(false)}>
                Cancel
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
