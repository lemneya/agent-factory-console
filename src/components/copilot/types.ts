/**
 * Types for the Copilot feature
 */

export interface Source {
  id: string;
  title: string;
  url: string;
  snippet?: string;
  type: 'documentation' | 'api' | 'code' | 'external' | 'internal';
}

export interface CopilotMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  timestamp: Date;
  isLoading?: boolean;
}

export interface CopilotState {
  messages: CopilotMessage[];
  isOpen: boolean;
  isLoading: boolean;
}
