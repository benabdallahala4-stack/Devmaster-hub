export type Difficulty = 'junior' | 'mid' | 'senior';

export type SectionKind =
  | 'intro' | 'why' | 'concept' | 'example' | 'mistake' | 'bestpractice' | 'note';

export type BlockType =
  | 'paragraph' | 'heading' | 'list' | 'code' | 'callout' | 'table';

export type CalloutVariant = 'info' | 'warning' | 'danger' | 'success';

export interface ContentBlock {
  type: BlockType;
  text?: string;
  items?: string[];
  code?: string;
  language?: string;
  variant?: CalloutVariant;
  headers?: string[];
  rows?: string[][];
}

export interface Section {
  id: string;
  heading: string;
  kind: SectionKind;
  blocks: ContentBlock[];
}

export interface Diagram {
  id: string;
  title: string;
  type: 'mermaid' | 'ascii';
  content: string;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  answer: string;
  difficulty: Difficulty;
  category: string;
  tricky: boolean;
  tags: string[];
  followUps?: string[];
  /** populated at runtime so a question always knows its origin topic */
  topicId?: string;
  topicTitle?: string;
}

export interface Challenge {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string;
  prompt: string;
  hints: string[];
  solutionCode: string;
  solutionLanguage: string;
  explanation: string;
  relatedTopic?: string;
}

export interface TopicContent {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  estReadMinutes: number;
  sections: Section[];
  diagrams: Diagram[];
  questions: InterviewQuestion[];
  challenges: Challenge[];
  references?: { label: string; url: string }[];
}

/** Lightweight catalog entry stored in index.json (no heavy body). */
export interface TopicMeta {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  difficulty: Difficulty;
  tags: string[];
  description: string;
  estReadMinutes: number;
  questionCount: number;
  challengeCount: number;
}

export interface CategoryGroup {
  name: string;
  topics: TopicMeta[];
}

export type LogicCategory =
  | 'Logic' | 'Probability' | 'Math & Aptitude' | 'Lateral Thinking'
  | 'Estimation' | 'SQL Puzzle' | 'Brain Teaser';

export interface RubricCriterion {
  id: string;
  text: string;     // e.g. "Identified the loop invariant"
  points: number;   // weight (> 0); maxScore = sum of all points
}

export interface LogicProblem {
  id: string;
  title: string;
  category: LogicCategory;
  difficulty: Difficulty;
  tags: string[];
  prompt: ContentBlock[];
  constraints?: string[];
  hints: string[];               // progressive, >= 2
  modelSolution: ContentBlock[]; // revealable worked solution
  rubric: RubricCriterion[];     // 3-5 criteria
  relatedTopic?: string;         // optional topic id
}
