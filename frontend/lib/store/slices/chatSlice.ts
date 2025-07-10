import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Message, ChatState, SendMessageRequest } from '../types';
import * as chatAPI from '../api/chatAPI';

const initialState: ChatState = {
  conversations: [],
  activeConversation: null,
  isLoading: false,
  isTyping: false,
  error: null,
};

// Async thunks for API calls
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async () => {
    const response = await chatAPI.getConversations();
    return response.conversations;
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async (request: SendMessageRequest) => {
    const response = await chatAPI.sendMessage(request);
    return { message: response.message, conversationId: response.message.conversationId };
  }
);

export const deleteConversation = createAsyncThunk(
  'chat/deleteConversation',
  async (conversationId: string) => {
    await chatAPI.deleteConversation(conversationId);
    return conversationId;
  }
);

export const fetchChats = createAsyncThunk(
  'chat/fetchChats',
  async (conversationId: string) => {
    const response = await chatAPI.getChats(conversationId);
    return { conversationId, messages: response.messages };
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveChat: (state, action: PayloadAction<string | null>) => {
      state.activeConversation = action.payload;
    },
    addUserMessage: (state, action: PayloadAction<{ conversationId?: string | null; message: string }>) => {
      const { message, conversationId } = action.payload;

      let conversation = state.conversations.find(c => c.id === conversationId);

      // If no conversation exists (new conversation with temp ID), create it
      if (!conversation && conversationId?.startsWith('temp-')) {
        conversation = {
          id: conversationId,
          title: 'New Conversation',
          messages: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        state.conversations.unshift(conversation);
        state.activeConversation = conversationId;
      }

      if (conversation) {
        const timestamp = new Date().toISOString();
        conversation.messages.push({
          id: timestamp,
          role: 'user',
          content: message,
          createdAt: timestamp,
        });
        conversation.updatedAt = timestamp;
      }
    },
    removeUserMessage: (
      state,
      action: PayloadAction<{ conversationId?: string | null; messageContent: string }>
    ) => {
      const { conversationId, messageContent } = action.payload;
      const conversation = state.conversations.find(c => c.id === conversationId);
      if (conversation) {
        const index = [...conversation.messages]
          .reverse()
          .findIndex(m => m.role === 'user' && m.content === messageContent);
        if (index !== -1) {
          conversation.messages.splice(conversation.messages.length - 1 - index, 1);
        }
      }
    },
    setTyping: (state, action: PayloadAction<boolean>) => {
      state.isTyping = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateChatTitle: (state, action: PayloadAction<{ chatId: string; title: string }>) => {
      const { chatId, title } = action.payload;
      const conversation = state.conversations.find(c => c.id === chatId);
      if (conversation) {
        conversation.title = title;
      }
    },
    resetChatState: (state) => {
      state.activeConversation = null;
      state.isTyping = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder

      // fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch conversations';
      })


      // fetch conversation chats
      .addCase(fetchChats.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchChats.fulfilled, (state, action) => {
        state.isLoading = false;
        const { conversationId, messages } = action.payload;
        const conversation = state.conversations.find(c => c.id === conversationId);
        if (conversation) {
          conversation.messages = messages;
        }
      })
      .addCase(fetchChats.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch chat messages';
      })


      // send message
      .addCase(sendMessage.pending, (state) => {
        state.isTyping = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isTyping = false;
        const { conversationId, message } = action.payload;

        // First, try to find the temporary conversation
        let conversation = state.conversations.find(c => c.id.startsWith('temp-'));

        if (conversation) {
          // Update the temporary conversation with the real ID
          conversation.id = message.conversationId;
          conversation.title = message.title;
        } else {
          // If no temporary conversation found, try to find by real ID
          conversation = state.conversations.find(c => c.id === conversationId);
        }

        if (!conversation) {
          // Create new conversation if none exists (fallback)
          conversation = {
            id: message.conversationId,
            title: message.title,
            messages: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          state.conversations.unshift(conversation);
        }

        // Add the assistant message
        conversation.messages.push({
          id: message.timestamp,
          role: 'assistant',
          content: message.assistant,
          createdAt: message.timestamp,
        });

        conversation.title = message.title;
        conversation.updatedAt = new Date().toISOString();
        state.activeConversation = message.conversationId;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isTyping = false;
        state.error = action.error.message || 'Failed to send message';
      })


      // delete conversation
      .addCase(deleteConversation.fulfilled, (state, action) => {
        state.conversations = state.conversations.filter(c => c.id !== action.payload);
        if (state.activeConversation === action.payload) {
          state.activeConversation = null;
        }
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to delete conversation';
      });
  },
});

export const {
  setActiveChat,
  addUserMessage,
  removeUserMessage,
  resetChatState,
  setTyping,
  clearError,
  updateChatTitle,
} = chatSlice.actions;

export default chatSlice.reducer;