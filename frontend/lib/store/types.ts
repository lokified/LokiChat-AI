export interface Message {
  conversationId: string;
  title: string;
  user: string;
  assistant: string;
  timestamp: string;
  model?: string;
}

export interface ChatMessage {
  id: string;
  role: string;
  content: string;
  processingTimeMs?: BigInt;
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface ChatState {
  conversations: Conversation[];
  activeConversation: string | null;
  isLoading: boolean;
  isTyping: boolean;
  error: string | null;
}

export interface Settings {
  model: string;
  theme: 'light' | 'dark' | 'system';
}

export interface SettingsState {
  settings: Settings;
  isLoading: boolean;
  error: string | null;
}

export interface RootState {
  chat: ChatState;
  settings: SettingsState;
}

// API Response types

export interface SendMessageRequest {
  message: string;
  conversationId?: string | null;
}

export interface SendMessageResponse {
  message: Message;
}

export interface GetChatMessageResponse {
  messages: ChatMessage[];
}

export interface GetConversationResponse {
  conversations: Conversation[];
}

export interface UpdateSettingsRequest {
  settings: Partial<Settings>;
}