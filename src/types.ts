export type Language = 'en' | 'es';

export interface StudyQuestion {
  id: number;
  question: string;
  hint: string;
  answer: string;
}

export interface AnalysisResult {
  isStudyNotes: boolean;
  readabilityAssessment?: string;
  title: string;
  subject?: string;
  keyTopics?: string[];
  summary: string;
  questions: StudyQuestion[];
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  color: string; // Tailwind color theme identifier (e.g. indigo, emerald, amber, rose, sky, purple)
  icon?: string; // Icon identifier
  customInstructions?: string; // Like ChatGPT projects: custom instructions for the course (e.g. "Focus on exam definitions and formulas")
  createdAt: number;
}

export interface StoredScan {
  id: string;
  projectId?: string;
  timestamp: number;
  title: string;
  subject?: string;
  language: Language;
  imageThumbnail: string; // Small preview data URL
  fullImage?: string;
  result: AnalysisResult;
}

export type CameraErrorType = 
  | 'PERMISSION_DENIED'
  | 'DEVICE_NOT_FOUND'
  | 'IN_USE'
  | 'NOT_SUPPORTED'
  | 'UNKNOWN';
