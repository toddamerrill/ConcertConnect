import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { ApiClient } from '../lib/api';
import { CalendarIcon, MapPinIcon, TicketIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  venueAddress: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | string;
  eventDate: string;
  imageUrl?: string;
  genre?: string;
  priceRange?: any;
  userInteractions?: string[];
}

interface SearchParams {
  city: string;
  state: string;
  genre: string;
  keyword: string;
  page: number;
}

export default function EventsPage() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    city: '',
    state: '',
    genre: '',
    keyword: '',
    page: 0
  });
  const [genres, setGenres] = useState<string[]>([]);

  useEffect(() => {
    loadGenres();
    loadEvents();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [searchParams]);

  const loadGenres = async () => {
    try {
      const response = await ApiClient.makeRequest('/api/events/meta/genres', {
        requireAuth: false
      });
      setGenres(response.data.genres);
    } catch (error) {
      console.error('Error loading genres:', error);
    }
  };

  const loadEvents = async () => {
    try {
      setLoading(true);
      
      // Try to get featured events if no search parameters
      if (!searchParams.keyword && !searchParams.city && !searchParams.genre) {
        const response = await ApiClient.getFeaturedEvents(20);
        setEvents(response.data?.events || []);
      } else {
        // Use search endpoint
        const response = await ApiClient.searchEvents({
          ...searchParams,
          size: 20
        });
        setEvents(response.data?.events || []);
      }
    } catch (error) {
      console.error('Error loading events:', error);
      // Fallback to empty array if API fails
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams(prev => ({ ...prev, page: 0 }));
  };

  const updateSearchParam = (key: keyof SearchParams, value: string | number) => {
    setSearchParams(prev => ({ ...prev, [key]: value }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <Head>
        <title>Browse Events - Concert Connect</title>
        <meta name="description" content="Discover and browse upcoming concerts and events" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <Link href="/" className="text-2xl font-bold text-primary-600">
                Concert Connect
              </Link>
              <nav className="flex items-center space-x-6">
                {session ? (
                  <>
                    <span className="text-gray-700">
                      Welcome, {session.user?.name || session.user?.email}
                    </span>
                    <Link href="/api/auth/signout" className="text-primary-600 hover:text-primary-700">
                      Sign Out
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/signin" className="text-primary-600 hover:text-primary-700">
                      Sign In
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                    >
                      Sign Up
                    </Link>
                  </>
                )}
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Title */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Browse Events</h1>
            <p className="text-xl text-gray-600">
              Discover amazing concerts and events happening near you
            </p>
          </div>

          {/* Search Form */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="keyword" className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  id="keyword"
                  placeholder="Artist, event, or venue"
                  value={searchParams.keyword}
                  onChange={(e) => updateSearchParam('keyword', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                  City
                </label>
                <input
                  type="text"
                  id="city"
                  placeholder="Enter city"
                  value={searchParams.city}
                  onChange={(e) => updateSearchParam('city', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label htmlFor="genre" className="block text-sm font-medium text-gray-700 mb-2">
                  Genre
                </label>
                <select
                  id="genre"
                  value={searchParams.genre}
                  onChange={(e) => updateSearchParam('genre', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">All Genres</option>
                  {genres.map((genre) => (
                    <option key={genre} value={genre}>
                      {genre.charAt(0).toUpperCase() + genre.slice(1)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-end">
                <button
                  type="submit"
                  className="w-full bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  Search Events
                </button>
              </div>
            </form>
          </div>

          {/* Events Grid */}
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="loading-spinner w-8 h-8"></div>
              <span className="ml-3 text-gray-600">Loading events...</span>
            </div>
          ) : events.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <div key={event.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  {event.imageUrl && (
                    <div className="h-48 bg-gray-200">
                      <img
                        src={event.imageUrl}
                        alt={event.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {event.title}
                    </h3>
                    {event.artistName && (
                      <p className="text-lg text-primary-600 mb-2">{event.artistName}</p>
                    )}
                    
                    <div className="space-y-2 mb-4">
                      {event.eventDate && (
                        <div className="flex items-center text-gray-600">
                          <CalendarIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            {formatDate(event.eventDate)} at {formatTime(event.eventDate)}
                          </span>
                        </div>
                      )}
                      
                      {event.venueName && (
                        <div className="flex items-start text-gray-600">
                          <MapPinIcon className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                          <div className="text-sm">
                            <div className="font-medium">{event.venueName}</div>
                            {event.venueAddress && (
                              <div className="text-gray-500">
                                {typeof event.venueAddress === 'string' 
                                  ? event.venueAddress 
                                  : `${event.venueAddress.street || ''} ${event.venueAddress.city || ''}, ${event.venueAddress.state || ''} ${event.venueAddress.zipCode || ''}`.trim()
                                }
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                      
                      {event.priceRange && (
                        <div className="flex items-center text-gray-600">
                          <TicketIcon className="h-4 w-4 mr-2" />
                          <span className="text-sm">
                            ${event.priceRange.min} - ${event.priceRange.max}
                          </span>
                        </div>
                      )}
                    </div>

                    {event.genre && (
                      <div className="mb-4">
                        <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full">
                          {event.genre.charAt(0).toUpperCase() + event.genre.slice(1)}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <Link
                        href={`/events/${event.id}`}
                        className="text-primary-600 hover:text-primary-700 font-medium"
                      >
                        View Details →
                      </Link>
                      
                      {session && (
                        <div className="flex space-x-2">
                          {event.userInteractions?.includes('interested') ? (
                            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                              Interested
                            </span>
                          ) : null}
                          {event.userInteractions?.includes('going') ? (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                              Going
                            </span>
                          ) : null}
                          {event.userInteractions?.includes('purchased') ? (
                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              Purchased
                            </span>
                          ) : null}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">🎵</div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">No Events Found</h3>
              <p className="text-gray-600 mb-6">
                {searchParams.keyword || searchParams.city || searchParams.genre
                  ? 'Try adjusting your search criteria to find more events.'
                  : 'No events are currently available. Check back soon!'}
              </p>
              {(searchParams.keyword || searchParams.city || searchParams.genre) && (
                <button
                  onClick={() => setSearchParams({
                    city: '',
                    state: '',
                    genre: '',
                    keyword: '',
                    page: 0
                  })}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear Search
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}