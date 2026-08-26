export interface DailyTask {
  day: number;
  title: string;
  theme: string;
  prompt: string;
  targetWords: number;
  grammarFocus: string;
}

export interface GrammarCorrection {
  original: string;
  correction: string;
  reason: string;
}

export interface VocabularyItem {
  word: string;
  meaning: string;
  cefrLevel: string;
}

export interface AnalysisResponse {
  score: number;
  wordCount: number;
  tensesUsed: {
    past: number;
    present: number;
    future: number;
  };
  vocabularyUsed: VocabularyItem[];
  grammarCorrections: GrammarCorrection[];
  feedback: string;
  fluencyAdvice: string;
}
