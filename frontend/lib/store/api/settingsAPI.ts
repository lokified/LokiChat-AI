import { Settings, UpdateSettingsRequest } from '../types';

// Simulated API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Simulated settings storage
let settingsDB: Settings = {
  model: 'llama2',
  theme: 'system',
};

// API Functions - Replace these with real API calls

export const getSettings = async (): Promise<{ settings: Settings }> => {
  await delay(200);
  
  // Try to load from localStorage first (for demo purposes)
  const savedSettings = localStorage.getItem('ai-chat-settings');
  if (savedSettings) {
    settingsDB = JSON.parse(savedSettings);
  }
  
  return { settings: settingsDB };
};

export const updateSettings = async (request: UpdateSettingsRequest): Promise<{ settings: Settings }> => {
  await delay(300);
  
  // Update settings
  settingsDB = { ...settingsDB, ...request.settings };
  
  // Save to localStorage (for demo purposes)
  localStorage.setItem('ai-chat-settings', JSON.stringify(settingsDB));
  
  return { settings: settingsDB };
};

// Export for easy replacement with real API
export const settingsAPI = {
  getSettings,
  updateSettings,
};