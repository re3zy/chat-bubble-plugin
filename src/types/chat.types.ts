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

export interface ColorConfig {
  backgroundColor: string;
  userBubbleColor: string;
  userTextColor: string;
  assistantBubbleColor: string;
  assistantTextColor: string;
  headerBackgroundColor: string;
  headerTextColor: string;
  inputBackgroundColor: string;
  inputTextColor: string;
  placeholderTextColor: string;
  buttonBackgroundColor: string;
  buttonTextColor: string;
  timestampColor: string;
  dayStampBackgroundColor: string;
  dayStampTextColor: string;
}

export interface ChatInterfaceProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void | Promise<void>;
  onClearChat?: () => void | Promise<void>;
  isLoading?: boolean;
  placeholder?: string;
  showUserEmail?: boolean;
  colorConfig?: ColorConfig;
}