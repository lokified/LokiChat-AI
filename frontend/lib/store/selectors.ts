import { RootState } from './types';

// Chat selectors
export const selectConversations = (state: RootState) => state.chat.conversations;
export const selectActiveConversation = (state: RootState) => state.chat.activeConversation;
export const selectActiveConversationData = (state: RootState) => 
  state.chat.conversations.find(conversation => conversation.id === state.chat.activeConversation);
export const selectConversationLoading = (state: RootState) => state.chat.isLoading;
export const selectConversationTyping = (state: RootState) => state.chat.isTyping;
export const selectConversationError = (state: RootState) => state.chat.error;

// Settings selectors
export const selectSettings = (state: RootState) => state.settings.settings;
export const selectCurrentModel = (state: RootState) => state.settings.settings.model;
export const selectCurrentTheme = (state: RootState) => state.settings.settings.theme;
export const selectSettingsLoading = (state: RootState) => state.settings.isLoading;
export const selectSettingsError = (state: RootState) => state.settings.error;