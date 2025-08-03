// src/types/chat.types.ts

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  email?: string; // Optional email field from Sigma data
}

export interface ChatConfig {
  model: string;
  systemPrompt: string;
  dataContext?: string;
}

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void | Promise<void>;
  onClearChat?: () => void | Promise<void>;
  isLoading?: boolean;
  title?: string;
  placeholder?: string;
  showUserEmail?: boolean;
}