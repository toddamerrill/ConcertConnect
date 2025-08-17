import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { apiClient } from '../../services/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface SocialPost {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  user: User;
  event?: {
    id: string;
    title: string;
    artistName: string;
    venueName: string;
    eventDate: string;
  };
  isLiked: boolean;
  _count: {
    likes: number;
    comments: number;
  };
}

interface FriendRequest {
  id: string;
  requester: User;
  createdAt: string;
}

interface SocialState {
  posts: SocialPost[];
  friends: User[];
  friendRequests: FriendRequest[];
  isLoading: boolean;
  postsLoading: boolean;
  error: string | null;
}

const initialState: SocialState = {
  posts: [],
  friends: [],
  friendRequests: [],
  isLoading: false,
  postsLoading: false,
  error: null,
};

// Async thunks
export const fetchSocialFeed = createAsyncThunk(
  'social/fetchFeed',
  async ({ page = 0, limit = 20 }: { page?: number; limit?: number } = {}) => {
    const response = await apiClient.get(`/api/social/posts?page=${page}&limit=${limit}`);
    return response.data.posts;
  }
);

export const createPost = createAsyncThunk(
  'social/createPost',
  async (postData: { content: string; eventId?: string; imageUrl?: string }) => {
    const response = await apiClient.post('/api/social/posts', postData);
    return response.data.post;
  }
);

export const likePost = createAsyncThunk(
  'social/likePost',
  async (postId: string) => {
    const response = await apiClient.post(`/api/social/posts/${postId}/like`);
    return { postId, liked: response.data.liked };
  }
);

export const fetchFriends = createAsyncThunk(
  'social/fetchFriends',
  async () => {
    const response = await apiClient.get('/api/social/friends');
    return response.data.friends;
  }
);

export const fetchFriendRequests = createAsyncThunk(
  'social/fetchFriendRequests',
  async () => {
    const response = await apiClient.get('/api/social/friends/requests');
    return response.data.requests;
  }
);

export const sendFriendRequest = createAsyncThunk(
  'social/sendFriendRequest',
  async (userId: string) => {
    const response = await apiClient.post('/api/social/friends/request', { userId });
    return response.data.friendship;
  }
);

export const respondToFriendRequest = createAsyncThunk(
  'social/respondToFriendRequest',
  async ({ requestId, action }: { requestId: string; action: 'accept' | 'decline' | 'block' }) => {
    const response = await apiClient.patch(`/api/social/friends/request/${requestId}`, { action });
    return { requestId, action, data: response.data };
  }
);

export const searchUsers = createAsyncThunk(
  'social/searchUsers',
  async (query: string) => {
    const response = await apiClient.get(`/api/users?q=${encodeURIComponent(query)}`);
    return response.data.users;
  }
);

const socialSlice = createSlice({
  name: 'social',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePostLike: (state, action) => {
      const { postId, liked } = action.payload;
      const post = state.posts.find(p => p.id === postId);
      if (post) {
        post.isLiked = liked;
        post._count.likes += liked ? 1 : -1;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch social feed
    builder
      .addCase(fetchSocialFeed.pending, (state) => {
        state.postsLoading = true;
        state.error = null;
      })
      .addCase(fetchSocialFeed.fulfilled, (state, action) => {
        state.postsLoading = false;
        state.posts = action.payload;
      })
      .addCase(fetchSocialFeed.rejected, (state, action) => {
        state.postsLoading = false;
        state.error = action.error.message || 'Failed to fetch social feed';
      });

    // Create post
    builder
      .addCase(createPost.fulfilled, (state, action) => {
        state.posts.unshift(action.payload);
      });

    // Like post
    builder
      .addCase(likePost.fulfilled, (state, action) => {
        const { postId, liked } = action.payload;
        socialSlice.caseReducers.updatePostLike(state, {
          type: 'social/updatePostLike',
          payload: { postId, liked }
        });
      });

    // Fetch friends
    builder
      .addCase(fetchFriends.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friends = action.payload;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch friends';
      });

    // Fetch friend requests
    builder
      .addCase(fetchFriendRequests.fulfilled, (state, action) => {
        state.friendRequests = action.payload;
      });

    // Respond to friend request
    builder
      .addCase(respondToFriendRequest.fulfilled, (state, action) => {
        const { requestId, action: responseAction } = action.payload;
        
        if (responseAction === 'accept') {
          // Remove from friend requests and add to friends if accepted
          const request = state.friendRequests.find(r => r.id === requestId);
          if (request) {
            state.friends.push(request.requester);
          }
        }
        
        // Remove from friend requests regardless of action
        state.friendRequests = state.friendRequests.filter(r => r.id !== requestId);
      });
  },
});

export const { clearError, updatePostLike } = socialSlice.actions;
export default socialSlice.reducer;