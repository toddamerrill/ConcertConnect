import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
}

export class ApiClient {
  private static async makeRequest<T>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<T> {
    const { 
      method = 'GET', 
      body, 
      headers = {}, 
      requireAuth = true 
    } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // Add auth token if required
    if (requireAuth) {
      const session = await getSession();
      if (session?.accessToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${session.accessToken}`,
        };
      }
    }

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred'
      }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // Auth endpoints
  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }) {
    return this.makeRequest('/api/auth/register', {
      method: 'POST',
      body: userData,
      requireAuth: false,
    });
  }

  static async login(credentials: { email: string; password: string }) {
    return this.makeRequest('/api/auth/login', {
      method: 'POST',
      body: credentials,
      requireAuth: false,
    });
  }

  static async getProfile() {
    return this.makeRequest('/api/auth/me');
  }

  static async updateProfile(profileData: any) {
    return this.makeRequest('/api/auth/me', {
      method: 'PATCH',
      body: profileData,
    });
  }

  // Events endpoints
  static async searchEvents(params: {
    city?: string;
    state?: string;
    genre?: string;
    keyword?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    size?: number;
  }) {
    const queryString = new URLSearchParams(params as any).toString();
    return this.makeRequest(`/api/events/search?${queryString}`, {
      requireAuth: false,
    });
  }

  static async getEvent(id: string) {
    return this.makeRequest(`/api/events/${id}`, {
      requireAuth: false,
    });
  }

  static async markEventInterest(eventId: string, type: 'interested' | 'going' | 'purchased') {
    return this.makeRequest(`/api/events/${eventId}/interest`, {
      method: 'POST',
      body: { type },
    });
  }

  static async removeEventInterest(eventId: string, type: string) {
    return this.makeRequest(`/api/events/${eventId}/interest/${type}`, {
      method: 'DELETE',
    });
  }

  static async getUserEvents(type?: string) {
    const query = type ? `?type=${type}` : '';
    return this.makeRequest(`/api/events/user/my-events${query}`);
  }

  static async getFeaturedEvents(limit: number = 10) {
    return this.makeRequest(`/api/events/featured/upcoming?limit=${limit}`, {
      requireAuth: false,
    });
  }

  // Social endpoints
  static async sendFriendRequest(userId: string) {
    return this.makeRequest('/api/social/friends/request', {
      method: 'POST',
      body: { userId },
    });
  }

  static async respondToFriendRequest(requestId: string, action: 'accept' | 'decline' | 'block') {
    return this.makeRequest(`/api/social/friends/request/${requestId}`, {
      method: 'PATCH',
      body: { action },
    });
  }

  static async getFriends() {
    return this.makeRequest('/api/social/friends');
  }

  static async getFriendRequests() {
    return this.makeRequest('/api/social/friends/requests');
  }

  static async createPost(postData: {
    content: string;
    eventId?: string;
    imageUrl?: string;
  }) {
    return this.makeRequest('/api/social/posts', {
      method: 'POST',
      body: postData,
    });
  }

  static async getSocialFeed(page: number = 0, limit: number = 20) {
    return this.makeRequest(`/api/social/posts?page=${page}&limit=${limit}`);
  }

  static async likePost(postId: string) {
    return this.makeRequest(`/api/social/posts/${postId}/like`, {
      method: 'POST',
    });
  }

  // Users endpoints
  static async searchUsers(query: string, limit: number = 20) {
    return this.makeRequest(`/api/users?q=${encodeURIComponent(query)}&limit=${limit}`);
  }

  static async getUserProfile(userId: string) {
    return this.makeRequest(`/api/users/${userId}`, {
      requireAuth: false,
    });
  }

  // Payments endpoints
  static async createPaymentIntent(paymentData: {
    eventId: string;
    amount: number;
    currency?: string;
    description?: string;
  }) {
    return this.makeRequest('/api/payments/create-intent', {
      method: 'POST',
      body: paymentData,
    });
  }

  static async confirmPayment(paymentId: string) {
    return this.makeRequest(`/api/payments/confirm/${paymentId}`, {
      method: 'POST',
    });
  }

  static async getPaymentHistory(page: number = 0, limit: number = 20) {
    return this.makeRequest(`/api/payments/history?page=${page}&limit=${limit}`);
  }
}