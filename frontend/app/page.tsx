"use client";

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  MessageCircle,
  Plus,
  Settings,
  Send,
  Moon,
  Sun,
  Trash2,
  Bot,
  User,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import {
  sendMessage,
  setActiveChat,
  addUserMessage,
  fetchConversations,
  deleteConversation,
  resetChatState,
  removeUserMessage,
} from '@/lib/store/slices/chatSlice';
import {
  fetchSettings,
  updateSettings,
  setModel,
} from '@/lib/store/slices/settingsSlice';
import {
  selectSettings,
  selectCurrentModel,
  selectSettingsLoading,
  selectConversations,
  selectActiveConversation,
  selectActiveConversationData,
  selectConversationLoading,
  selectConversationTyping,
  selectConversationError,
} from '@/lib/store/selectors';
import MarkdownRenderer from '@/components/ui/MarkdownRenderer';

export default function Home() {
  const dispatch = useAppDispatch();
  const { theme, setTheme } = useTheme();

  // Redux state
  const conversations = useAppSelector(selectConversations);
  const activeConversation = useAppSelector(selectActiveConversation);
  const activeConversationData = useAppSelector(selectActiveConversationData);
  const isLoading = useAppSelector(selectConversationLoading);
  const isTyping = useAppSelector(selectConversationTyping);
  const conversationError = useAppSelector(selectConversationError);
  const settings = useAppSelector(selectSettings);
  const currentModel = useAppSelector(selectCurrentModel);
  const settingsLoading = useAppSelector(selectSettingsLoading);

  // Local state
  const [message, setMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const models = [
    { id: 'llama2', name: 'llama2', description: 'Most capable model' },
  ];

  // Load initial data
  useEffect(() => {
    dispatch(fetchConversations());
    dispatch(fetchSettings());
  }, [dispatch]);

  // Add this function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (viewport) {
        viewport.scrollTop = viewport.scrollHeight;
      }
    }
  };

  // Add useEffect to scroll when messages change
  useEffect(() => {
    scrollToBottom();
  }, [activeConversationData?.messages, isTyping]);

  // Add useEffect to scroll when active conversation changes
  useEffect(() => {
    if (activeConversationData) {
      // Small delay to ensure content is rendered
      setTimeout(() => scrollToBottom(), 100);
    }
  }, [activeConversation]);

  const handleCreateNewChat = async () => {
    dispatch(resetChatState());
    setMessage(''); // Clear input
    setSidebarOpen(false);
  };


  const handleDeleteConversation = async (chatId: string) => {
    try {
      await dispatch(deleteConversation(chatId)).unwrap();
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;

    let currentConversationId = activeConversation;
    let serverConversationId = currentConversationId;

    // If no active conversation, create a temporary one for local state
    if (!currentConversationId) {
      currentConversationId = `temp-${Date.now()}`;
      serverConversationId = null;
    }

    // Add user message to chat with temporary ID
    dispatch(addUserMessage({ conversationId: currentConversationId, message: message }));

    const userMessage = message;
    setMessage('');

    try {
      await dispatch(sendMessage({
        message: userMessage,
        conversationId: serverConversationId
      })).unwrap();
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessage(userMessage);
      dispatch(removeUserMessage({
        conversationId: currentConversationId,
        messageContent: userMessage,
      }));
    }
  };

  const handleModelChange = async (modelId: string) => {
    dispatch(setModel(modelId));
    try {
      await dispatch(updateSettings({ settings: { model: modelId } })).unwrap();
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };

  const formatTime = (utcString: string) => {
    const isoString = utcString.replace(' ', 'T').split('.')[0] + 'Z';
    const date = new Date(isoString);

    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };



  const formatDate = (utcString: string) => {
    const isoString = utcString.replace(' ', 'T').split('.')[0] + 'Z';
    const date = new Date(isoString);

    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };


  return (
    <div className="flex h-screen bg-gradient-to-br from-background to-muted/20">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-80 bg-card/95 backdrop-blur-sm border-r border-border/50 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bot className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Loki Chat</h1>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <Button
            onClick={handleCreateNewChat}
            disabled={isLoading}
            className="w-full mt-4 bg-primary hover:bg-primary/90 text-primary-foreground"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Plus className="h-4 w-4 mr-2" />
            )}
            New Chat
          </Button>
        </div>

        {/* Chat History */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-2">
            {conversations.map((conversation) => (
              <Card
                key={conversation.id}
                className={`cursor-pointer transition-all duration-200 hover:bg-accent/50 group ${activeConversation === conversation.id ? 'bg-accent border-primary/50' : 'bg-card/50'
                  }`}
                onClick={() => {
                  dispatch(setActiveChat(conversation.id));
                  setSidebarOpen(false);
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <MessageCircle className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate">
                          {conversation.title}
                        </span>
                      </div>
                      {conversation.messages && (
                        <p className="text-xs text-muted-foreground truncate">
                          {conversation.messages[conversation.messages.length - 1].content}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        {formatDate(conversation.createdAt)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>

        {/* Settings Button */}
        <div className="p-4 border-t border-border/50">
          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={() => setShowSettings(true)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Navigation */}
        <div className="bg-card/95 backdrop-blur-sm border-b border-border/50 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              <div>
                <h2 className="text-lg font-semibold">
                  {activeConversationData?.title || 'Select a chat or start a new one'}
                </h2>
                <Badge variant="secondary" className="text-xs">
                  {currentModel}
                </Badge>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Chat Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          {activeConversationData ? (
            <div className="space-y-4 max-w-4xl mx-auto">
              {activeConversationData.messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-3 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                    }`}>
                    <div className={`p-2 rounded-full ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                      }`}>
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4" />
                      ) : (
                        <Bot className="h-4 w-4" />
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border border-border/50'
                      }`}>

                      <MarkdownRenderer content={msg.content} />

                      <div className="flex items-center justify-between mt-1">
                        <p className={`text-xs ${msg.role === 'user'
                          ? 'text-primary-foreground/70'
                          : 'text-muted-foreground'
                          }`}>
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 rounded-full bg-muted text-muted-foreground">
                      <Bot className="h-4 w-4" />
                    </div>
                    <div className="p-3 rounded-lg bg-card border border-border/50">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  Welcome to AI Chat
                </h3>
                <p className="text-sm text-muted-foreground">
                  Select a chat from the sidebar or start a new conversation
                </p>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Message Input */}
        <div className="p-4 border-t border-border/50 bg-card/95 backdrop-blur-sm">
          <div className="flex space-x-2 max-w-4xl mx-auto">
            <Input
              placeholder="Type your message..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
              className="flex-1"
              disabled={isTyping}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || isTyping}
            >
              {isTyping ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                Settings
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-3">AI Model</h4>
                <div className="space-y-2">
                  {models.map((model) => (
                    <div
                      key={model.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${currentModel === model.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:bg-accent/50'
                        }`}
                      onClick={() => handleModelChange(model.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium">{model.name}</h5>
                          <p className="text-sm text-muted-foreground">
                            {model.description}
                          </p>
                        </div>
                        {currentModel === model.id && (
                          <div className="w-4 h-4 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="flex justify-end">
                <Button onClick={() => setShowSettings(false)}>
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {conversationError && (
        <div className="fixed bottom-4 right-4 bg-destructive text-destructive-foreground p-3 rounded-lg shadow-lg">
          <p className="text-sm">{conversationError}</p>
        </div>
      )}
    </div>
  );
}