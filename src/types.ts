export interface UserProfile {
  id: string;
  email: string | null;
  displayName: string;
  photoURL?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  streak: number;
  lastActiveDate: string | null;
}

export interface SavedWord {
  id: string;
  english: string;
  arabic: string;
  phonetics: string;
  category: string;
  exampleEn: string;
  exampleAr: string;
  savedAt: string;
  learnedCount: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  date: string;
  identifiedWordsCount: number;
  durationSeconds: number;
}

export interface ConversationMessage {
  id: string;
  userId: string;
  sender: 'arabic' | 'english';
  originalText: string;
  translatedText: string;
  phonetics?: string;
  timestamp: string;
  savedAt: string;
}

export interface AppSettings {
  ttsVoice: string; // 'en-US' or 'en-GB'
  ttsPitch: number;
  ttsRate: number;
  autoSpeak: boolean;
  trackingWaitTime: number; // in milliseconds (e.g. 1500ms)
  screenOverlayTranslationEnabled: boolean; // enables the Android floating bubble OCR screen translation action
}
