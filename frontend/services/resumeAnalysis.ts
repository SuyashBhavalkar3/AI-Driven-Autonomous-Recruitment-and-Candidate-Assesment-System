import { getAuthToken } from "@/lib/auth";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface ResumeAnalysis {
  atsScore: number;
  summary: string;
  education: string;
  experience: Array<{
    role: string;
    company: string;
    duration: string;
  }>;
  skills: string[];
  categoryScores: Array<{
    category: string;
    score: number;
  }>;
  skillMatch: Array<{
    skill: string;
    match: number;
  }>;
  recommendations: string[];
  lackings: string[];
}

export const resumeAnalysisService = {
  async analyzeCurrentUserResume(): Promise<ResumeAnalysis> {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/resume-analysis/analyze`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to analyze resume');
    }

    const result = await response.json();
    return result.data;
  },

  async analyzeSpecificResume(candidateId: number): Promise<ResumeAnalysis> {
    const token = getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/resume-analysis/analyze/${candidateId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to analyze resume');
    }

    const result = await response.json();
    return result.data;
  }
};