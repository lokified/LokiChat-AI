import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Settings, SettingsState, UpdateSettingsRequest } from '../types';
import * as settingsAPI from '../api/settingsAPI';

const initialState: SettingsState = {
  settings: {
    model: 'llama2',
    theme: 'system',
  },
  isLoading: false,
  error: null,
};

// Async thunks for API calls
export const fetchSettings = createAsyncThunk(
  'settings/fetchSettings',
  async () => {
    const response = await settingsAPI.getSettings();
    return response.settings;
  }
);

export const updateSettings = createAsyncThunk(
  'settings/updateSettings',
  async (request: UpdateSettingsRequest) => {
    const response = await settingsAPI.updateSettings(request);
    return response.settings;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setModel: (state, action: PayloadAction<string>) => {
      state.settings.model = action.payload;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'system'>) => {
      state.settings.theme = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch settings
      .addCase(fetchSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = action.payload;
      })
      .addCase(fetchSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch settings';
      })
      
      // Update settings
      .addCase(updateSettings.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateSettings.fulfilled, (state, action) => {
        state.isLoading = false;
        state.settings = { ...state.settings, ...action.payload };
      })
      .addCase(updateSettings.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to update settings';
      });
  },
});

export const { setModel, setTheme, clearError } = settingsSlice.actions;

export default settingsSlice.reducer;