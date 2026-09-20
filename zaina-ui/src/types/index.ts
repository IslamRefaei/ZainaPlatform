export type QuestionType = 
  | 'mcq' 
  | 'truefalse' 
  | 'fillinblank' 
  | 'dragdrop' 
  | 'sequence' 
  | 'shortanswer'
  | 'spelling'
  | 'missingletters'
  | 'anagram'
  | 'spotmistake';

export interface ParsedQuestion {
  id: number;
  questionText: string;
  questionType: QuestionType;
  options: string[];
  difficulty: 'easy' | 'medium' | 'challenge';
  language: string;
  audioWord?: string;
}
