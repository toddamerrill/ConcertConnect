// Shared types across the Concert Connect platform

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
  dateOfBirth?: string;
  location?: {
    city?: string;
    state?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
  };
  musicPreferences?: {
    genres?: string[];
    maxEventPrice?: number;
  };
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  externalId?: string;
  title: string;
  description?: string;
  artistName?: string;
  venueName?: string;
  venueAddress?: {
    street?: string;
    city?: string;
    state?: string;
    stateCode?: string;
    country?: string;
    countryCode?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  eventDate?: string;
  ticketUrl?: string;
  imageUrl?: string;
  genre?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  externalSource?: 'ticketmaster' | 'bandsintown';
  isActive: boolean;
  userInteractions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Friendship {
  id: string;
  requesterId: string;
  addresseeId: string;
  status: 'pending' | 'accepted' | 'blocked';
  requester?: User;
  addressee?: User;
  createdAt: string;
  updatedAt: string;
}

export interface SocialPost {
  id: string;
  userId: string;
  eventId?: string;
  content: string;
  imageUrl?: string;
  user: User;
  event?: Event;
  isLiked: boolean;
  _count: {
    likes: number;
    comments: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  userId: string;
  eventId?: string;
  stripePaymentId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'succeeded' | 'failed' | 'canceled';
  description?: string;
  metadata?: any;
  event?: Event;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
}

// API request/response types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface SearchEventsRequest {
  city?: string;
  state?: string;
  genre?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  radius?: number;
  sort?: 'date,asc' | 'date,desc' | 'relevance,desc' | 'distance,asc';
}

export interface EventInteractionRequest {
  type: 'interested' | 'going' | 'purchased';
}

export interface CreatePostRequest {
  content: string;
  eventId?: string;
  imageUrl?: string;
}

export interface FriendRequestResponse {
  action: 'accept' | 'decline' | 'block';
}

export interface CreatePaymentIntentRequest {
  eventId: string;
  amount: number;
  currency?: string;
  description?: string;
}