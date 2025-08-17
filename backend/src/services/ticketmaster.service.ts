import axios, { AxiosResponse } from 'axios';
import { logger } from '../utils/logger';

interface TicketmasterEvent {
  id: string;
  name: string;
  type: string;
  url: string;
  locale: string;
  images: Array<{
    ratio: string;
    url: string;
    width: number;
    height: number;
    fallback: boolean;
  }>;
  dates: {
    start: {
      localDate: string;
      localTime?: string;
      dateTime?: string;
    };
    timezone?: string;
  };
  classifications?: Array<{
    primary: boolean;
    segment: { id: string; name: string };
    genre: { id: string; name: string };
    subGenre: { id: string; name: string };
  }>;
  priceRanges?: Array<{
    type: string;
    currency: string;
    min: number;
    max: number;
  }>;
  _embedded?: {
    venues?: Array<{
      name: string;
      type: string;
      id: string;
      locale: string;
      postalCode: string;
      timezone: string;
      city: { name: string };
      state: { name: string; stateCode: string };
      country: { name: string; countryCode: string };
      address: { line1: string };
      location: { longitude: string; latitude: string };
    }>;
    attractions?: Array<{
      name: string;
      type: string;
      id: string;
      locale: string;
      images?: Array<{
        ratio: string;
        url: string;
        width: number;
        height: number;
        fallback: boolean;
      }>;
      classifications?: Array<{
        primary: boolean;
        segment: { id: string; name: string };
        genre: { id: string; name: string };
        subGenre: { id: string; name: string };
      }>;
    }>;
  };
}

interface TicketmasterApiResponse {
  _embedded?: {
    events: TicketmasterEvent[];
  };
  page: {
    size: number;
    totalElements: number;
    totalPages: number;
    number: number;
  };
}

interface SearchEventsParams {
  city?: string;
  stateCode?: string;
  genre?: string;
  keyword?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  size?: number;
  page?: number;
  radius?: number;
  unit?: 'miles' | 'km';
  sort?: 'date,asc' | 'date,desc' | 'relevance,desc' | 'distance,asc';
}

export class TicketmasterService {
  private baseUrl = 'https://app.ticketmaster.com/discovery/v2';
  private apiKey: string;
  private rateLimitDelay = 200; // 200ms between requests to respect rate limits

  constructor() {
    this.apiKey = process.env.TICKETMASTER_API_KEY || '';
    if (!this.apiKey) {
      logger.warn('⚠️ Ticketmaster API key not configured');
    }
  }

  async searchEvents(params: SearchEventsParams) {
    try {
      if (!this.apiKey) {
        throw new Error('Ticketmaster API key not configured');
      }

      const queryParams = new URLSearchParams({
        apikey: this.apiKey,
        size: (params.size || 20).toString(),
        page: (params.page || 0).toString(),
        sort: params.sort || 'date,asc'
      });

      if (params.city) queryParams.append('city', params.city);
      if (params.stateCode) queryParams.append('stateCode', params.stateCode);
      if (params.keyword) queryParams.append('keyword', params.keyword);
      if (params.radius) queryParams.append('radius', params.radius.toString());
      if (params.unit) queryParams.append('unit', params.unit);

      if (params.genre) {
        queryParams.append('classificationName', params.genre);
      }

      if (params.dateRange) {
        queryParams.append('startDateTime', params.dateRange.start);
        queryParams.append('endDateTime', params.dateRange.end);
      }

      logger.info(`🎫 Searching Ticketmaster events with params: ${JSON.stringify(params)}`);

      const response: AxiosResponse<TicketmasterApiResponse> = await axios.get(
        `${this.baseUrl}/events`,
        {
          params: Object.fromEntries(queryParams),
          timeout: 10000
        }
      );

      // Respect rate limits
      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      return this.normalizeEventData(response.data);
    } catch (error) {
      logger.error('❌ Error fetching events from Ticketmaster:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          throw new Error('Invalid Ticketmaster API key');
        } else if (error.response?.status === 429) {
          throw new Error('Ticketmaster API rate limit exceeded');
        }
      }
      
      throw new Error('Failed to fetch events from Ticketmaster');
    }
  }

  async getEventById(eventId: string) {
    try {
      if (!this.apiKey) {
        throw new Error('Ticketmaster API key not configured');
      }

      const response: AxiosResponse<TicketmasterEvent> = await axios.get(
        `${this.baseUrl}/events/${eventId}`,
        {
          params: { apikey: this.apiKey },
          timeout: 10000
        }
      );

      await new Promise(resolve => setTimeout(resolve, this.rateLimitDelay));

      return this.normalizeEventData({ 
        _embedded: { events: [response.data] },
        page: { size: 1, totalElements: 1, totalPages: 1, number: 0 }
      }).events[0];
    } catch (error) {
      logger.error(`❌ Error fetching event ${eventId} from Ticketmaster:`, error);
      throw new Error('Failed to fetch event from Ticketmaster');
    }
  }

  private normalizeEventData(apiResponse: TicketmasterApiResponse) {
    const events = apiResponse._embedded?.events || [];
    
    const normalizedEvents = events.map(event => {
      const venue = event._embedded?.venues?.[0];
      const attraction = event._embedded?.attractions?.[0];
      const classification = event.classifications?.[0] || attraction?.classifications?.[0];
      
      return {
        externalId: event.id,
        title: event.name,
        description: null,
        artistName: attraction?.name || null,
        venueName: venue?.name || null,
        venueAddress: venue ? {
          street: venue.address?.line1,
          city: venue.city?.name,
          state: venue.state?.name,
          stateCode: venue.state?.stateCode,
          country: venue.country?.name,
          countryCode: venue.country?.countryCode,
          postalCode: venue.postalCode,
          latitude: venue.location?.latitude ? parseFloat(venue.location.latitude) : null,
          longitude: venue.location?.longitude ? parseFloat(venue.location.longitude) : null
        } : null,
        eventDate: event.dates?.start?.dateTime ? new Date(event.dates.start.dateTime) : 
                   event.dates?.start?.localDate ? new Date(`${event.dates.start.localDate}T${event.dates.start.localTime || '20:00:00'}`) : null,
        ticketUrl: event.url,
        imageUrl: event.images?.find(img => img.ratio === '16_9')?.url || 
                  event.images?.[0]?.url || 
                  attraction?.images?.find(img => img.ratio === '16_9')?.url ||
                  attraction?.images?.[0]?.url,
        genre: classification?.genre?.name?.toLowerCase() || 
               classification?.segment?.name?.toLowerCase() || 
               'music',
        priceRange: event.priceRanges?.[0] ? {
          min: event.priceRanges[0].min,
          max: event.priceRanges[0].max,
          currency: event.priceRanges[0].currency
        } : null,
        externalSource: 'ticketmaster' as const
      };
    });

    return {
      events: normalizedEvents,
      pagination: {
        page: apiResponse.page.number,
        size: apiResponse.page.size,
        totalElements: apiResponse.page.totalElements,
        totalPages: apiResponse.page.totalPages
      }
    };
  }

  // Get popular genres for filtering
  getAvailableGenres() {
    return [
      'rock',
      'pop',
      'country',
      'hip-hop',
      'jazz',
      'blues',
      'electronic',
      'classical',
      'folk',
      'reggae',
      'r&b',
      'metal',
      'punk',
      'indie',
      'alternative'
    ];
  }

  // Helper to format date for API
  static formatDateForAPI(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/, 'Z');
  }
}