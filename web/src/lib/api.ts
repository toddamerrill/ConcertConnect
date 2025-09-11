import { getSession } from 'next-auth/react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: any;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  useProxy?: boolean; // Use NextAuth proxy instead of direct backend call
}

export class ApiClient {
  static async makeRequest<T>(
    endpoint: string, 
    options: ApiOptions = {}
  ): Promise<T> {
    const { 
      method = 'GET', 
      body, 
      headers = {}, 
      requireAuth = true,
      useProxy = false
    } = options;

    const config: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
    };

    // For proxy routes (NextAuth authenticated), don't add Authorization header
    // The proxy will handle authentication via NextAuth session
    if (!useProxy && requireAuth) {
      try {
        const session = await getSession();
        if (session?.user) {
          // For direct backend calls, use email as Bearer token (hybrid auth)
          config.headers = {
            ...config.headers,
            Authorization: `Bearer ${session.user.email}`,
          };
        }
      } catch (error) {
        console.warn('Failed to get session for API call:', error);
      }
    }

    // Add body for non-GET requests
    if (body && method !== 'GET') {
      config.body = JSON.stringify(body);
    }

    // Use proxy route (localhost:3000) or direct backend (localhost:3001)
    const baseUrl = useProxy ? '' : API_URL;
    const response = await fetch(`${baseUrl}${endpoint}`, config);
    
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
    return this.makeRequest(`/api/events/user/my-events${query}`, {
      useProxy: true, // Use NextAuth proxy route
    });
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
      useProxy: true, // Use NextAuth proxy route
    });
  }

  static async respondToFriendRequest(requestId: string, action: 'accept' | 'decline' | 'block') {
    return this.makeRequest(`/api/social/friends/request/${requestId}`, {
      method: 'PATCH',
      body: { action },
      useProxy: true, // Use NextAuth proxy route
    });
  }

  static async getFriends() {
    return this.makeRequest('/api/social/friends', {
      useProxy: true, // Use NextAuth proxy route
    });
  }

  static async getFriendRequests() {
    return this.makeRequest('/api/social/friends/requests', {
      useProxy: true, // Use NextAuth proxy route
    });
  }

  static async createPost(postData: {
    content: string;
    eventId?: string;
    imageUrl?: string;
  }) {
    return this.makeRequest('/api/social/posts', {
      method: 'POST',
      body: postData,
      useProxy: true, // Use NextAuth proxy route
    });
  }

  static async getSocialFeed(page: number = 0, limit: number = 20) {
    return this.makeRequest(`/api/social/posts?page=${page}&limit=${limit}`, {
      useProxy: true, // Use NextAuth proxy route
    });
  }

  static async likePost(postId: string) {
    return this.makeRequest(`/api/social/posts/${postId}/like`, {
      method: 'POST',
      useProxy: true, // Use NextAuth proxy route
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