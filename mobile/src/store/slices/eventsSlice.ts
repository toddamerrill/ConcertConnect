import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';

interface Event {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  imageUrl?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  userInteractions?: string[];
}

interface EventsState {
  events: Event[];
  featuredEvents: Event[];
  userEvents: Record<string, Event[]>;
  searchResults: Event[];
  currentEvent: Event | null;
  isLoading: boolean;
  searchLoading: boolean;
  error: string | null;
  searchQuery: string;
  pagination: {
    page: number;
    totalPages: number;
    totalElements: number;
  };
}

const initialState: EventsState = {
  events: [],
  featuredEvents: [],
  userEvents: {},
  searchResults: [],
  currentEvent: null,
  isLoading: false,
  searchLoading: false,
  error: null,
  searchQuery: '',
  pagination: {
    page: 0,
    totalPages: 0,
    totalElements: 0,
  },
};

// Async thunks
export const fetchFeaturedEvents = createAsyncThunk(
  'events/fetchFeatured',
  async (limit: number = 10) => {
    const response = await apiClient.get(`/api/events/featured/upcoming?limit=${limit}`);
    return response.data.events;
  }
);

export const searchEvents = createAsyncThunk(
  'events/search',
  async (params: {
    city?: string;
    state?: string;
    genre?: string;
    keyword?: string;
    page?: number;
    size?: number;
  }) => {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(`/api/events/search?${queryParams.toString()}`);
    return {
      events: response.data.events,
      pagination: response.data.pagination
    };
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchById',
  async (eventId: string) => {
    const response = await apiClient.get(`/api/events/${eventId}`);
    return response.data.event;
  }
);

export const markEventInterest = createAsyncThunk(
  'events/markInterest',
  async ({ eventId, type }: { eventId: string; type: 'interested' | 'going' | 'purchased' }) => {
    const response = await apiClient.post(`/api/events/${eventId}/interest`, { type });
    return { eventId, type, data: response.data };
  }
);

export const removeEventInterest = createAsyncThunk(
  'events/removeInterest',
  async ({ eventId, type }: { eventId: string; type: string }) => {
    await apiClient.delete(`/api/events/${eventId}/interest/${type}`);
    return { eventId, type };
  }
);

export const fetchUserEvents = createAsyncThunk(
  'events/fetchUserEvents',
  async (type?: string) => {
    const url = type ? `/api/events/user/my-events?type=${type}` : '/api/events/user/my-events';
    const response = await apiClient.get(url);
    return response.data.events;
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearSearchResults: (state) => {
      state.searchResults = [];
      state.searchQuery = '';
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    updateEventInteraction: (state, action: PayloadAction<{ eventId: string; type: string; remove?: boolean }>) => {
      const { eventId, type, remove } = action.payload;
      
      // Update in all event arrays
      [state.events, state.featuredEvents, state.searchResults].forEach(eventArray => {
        const event = eventArray.find(e => e.id === eventId);
        if (event) {
          if (!event.userInteractions) {
            event.userInteractions = [];
          }
          
          if (remove) {
            event.userInteractions = event.userInteractions.filter(t => t !== type);
          } else if (!event.userInteractions.includes(type)) {
            event.userInteractions.push(type);
          }
        }
      });

      // Update current event if it matches
      if (state.currentEvent && state.currentEvent.id === eventId) {
        if (!state.currentEvent.userInteractions) {
          state.currentEvent.userInteractions = [];
        }
        
        if (remove) {
          state.currentEvent.userInteractions = state.currentEvent.userInteractions.filter(t => t !== type);
        } else if (!state.currentEvent.userInteractions.includes(type)) {
          state.currentEvent.userInteractions.push(type);
        }
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch featured events
    builder
      .addCase(fetchFeaturedEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFeaturedEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featuredEvents = action.payload;
      })
      .addCase(fetchFeaturedEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch featured events';
      });

    // Search events
    builder
      .addCase(searchEvents.pending, (state) => {
        state.searchLoading = true;
        state.error = null;
      })
      .addCase(searchEvents.fulfilled, (state, action) => {
        state.searchLoading = false;
        state.searchResults = action.payload.events;
        state.pagination = action.payload.pagination;
      })
      .addCase(searchEvents.rejected, (state, action) => {
        state.searchLoading = false;
        state.error = action.error.message || 'Failed to search events';
      });

    // Fetch event by ID
    builder
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch event';
      });

    // Mark event interest
    builder
      .addCase(markEventInterest.fulfilled, (state, action) => {
        const { eventId, type } = action.payload;
        eventsSlice.caseReducers.updateEventInteraction(state, {
          type: 'events/updateEventInteraction',
          payload: { eventId, type }
        });
      });

    // Remove event interest
    builder
      .addCase(removeEventInterest.fulfilled, (state, action) => {
        const { eventId, type } = action.payload;
        eventsSlice.caseReducers.updateEventInteraction(state, {
          type: 'events/updateEventInteraction',
          payload: { eventId, type, remove: true }
        });
      });

    // Fetch user events
    builder
      .addCase(fetchUserEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserEvents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.userEvents = action.payload;
      })
      .addCase(fetchUserEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch user events';
      });
  },
});

export const { clearError, clearSearchResults, setSearchQuery, updateEventInteraction } = eventsSlice.actions;
export default eventsSlice.reducer;