import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, TicketIcon, HeartIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid, UserGroupIcon as UserGroupIconSolid, TicketIcon as TicketIconSolid } from '@heroicons/react/24/solid';
import { ApiClient } from '../lib/api';

interface Event {
  id: string;
  title: string;
  artistName?: string;
  venueName?: string;
  venueAddress?: {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
  } | string;
  eventDate?: string;
  imageUrl?: string;
  genre?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  ticketUrl?: string;
  interactionDate: string;
}

interface UserEvents {
  interested: Event[];
  going: Event[];
  purchased: Event[];
}

export default function MyEventsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [userEvents, setUserEvents] = useState<UserEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<keyof UserEvents>('interested');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      loadUserEvents();
    }
  }, [status, router]);

  const loadUserEvents = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiClient.getUserEvents();
      setUserEvents(response.data.events);
    } catch (error: any) {
      console.error('Error loading user events:', error);
      setError('Failed to load your events');
    } finally {
      setLoading(false);
    }
  };

  const removeEvent = async (eventId: string, type: string) => {
    try {
      await ApiClient.makeRequest(`/api/events/${eventId}/interest/${type}`, {
        method: 'DELETE',
        requireAuth: false,
      });

      // Update local state
      setUserEvents(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          [type]: prev[type as keyof UserEvents].filter(event => event.id !== eventId)
        };
      });
    } catch (error: any) {
      console.error('Error removing event:', error);
      alert('Failed to remove event. Please try again.');
    }
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

  const getTabIcon = (tab: keyof UserEvents, isActive: boolean) => {
    const iconClass = "w-5 h-5 mr-2";
    switch (tab) {
      case 'interested':
        return isActive ? <HeartIconSolid className={iconClass} /> : <HeartIcon className={iconClass} />;
      case 'going':
        return isActive ? <UserGroupIconSolid className={iconClass} /> : <UserGroupIcon className={iconClass} />;
      case 'purchased':
        return isActive ? <TicketIconSolid className={iconClass} /> : <TicketIcon className={iconClass} />;
    }
  };

  const getTabColor = (tab: keyof UserEvents) => {
    switch (tab) {
      case 'interested': return 'yellow';
      case 'going': return 'green';
      case 'purchased': return 'blue';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your events...</p>
        </div>
      </div>
    );
  }

  if (error || !userEvents) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Failed to Load Events</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to load your events. Please try again.'}
          </p>
          <button
            onClick={loadUserEvents}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 mr-4"
          >
            Try Again
          </button>
          <Link
            href="/events"
            className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700"
          >
            Browse Events
          </Link>
        </div>
      </div>
    );
  }

  const currentEvents = userEvents[activeTab] || [];
  const totalEvents = Object.values(userEvents).reduce((sum, events) => sum + events.length, 0);

  return (
    <>
      <Head>
        <title>My Events - Concert Connect</title>
        <meta name="description" content="View and manage your saved events" />
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
                <Link href="/events" className="text-gray-700 hover:text-primary-600">
                  Browse Events
                </Link>
                <Link href="/my-events" className="text-primary-600 font-medium">
                  My Events
                </Link>
                <Link href="/profile" className="text-gray-700 hover:text-primary-600">
                  Profile
                </Link>
                <Link href="/settings" className="text-gray-700 hover:text-primary-600">
                  Settings
                </Link>
                <Link href="/api/auth/signout" className="text-primary-600 hover:text-primary-700">
                  Sign Out
                </Link>
              </nav>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">My Events</h1>
            <p className="text-xl text-gray-600">
              You have saved {totalEvents} event{totalEvents !== 1 ? 's' : ''} across all categories
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="mb-8">
            <div className="border-b border-gray-200">
              <nav className="-mb-px flex space-x-8">
                {(Object.keys(userEvents) as Array<keyof UserEvents>).map((tab) => {
                  const count = userEvents[tab].length;
                  const color = getTabColor(tab);
                  const isActive = activeTab === tab;
                  
                  return (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                        isActive
                          ? `border-${color}-500 text-${color}-600`
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {getTabIcon(tab, isActive)}
                      <span className="capitalize">{tab}</span>
                      <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                        isActive
                          ? `bg-${color}-100 text-${color}-800`
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Events Grid */}
          {currentEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentEvents.map((event) => (
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
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-bold text-gray-900 line-clamp-2">
                        {event.title}
                      </h3>
                      <button
                        onClick={() => removeEvent(event.id, activeTab)}
                        className="text-gray-400 hover:text-red-600 transition-colors"
                        title="Remove from list"
                      >
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>

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
                      
                      <div className={`px-2 py-1 text-xs rounded-full ${
                        activeTab === 'interested' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : activeTab === 'going' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}>
                        Added {formatDate(event.interactionDate)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">
                {activeTab === 'interested' ? '💝' : activeTab === 'going' ? '🎪' : '🎫'}
              </div>
              <h3 className="text-xl font-medium text-gray-900 mb-2">
                No {activeTab} events
              </h3>
              <p className="text-gray-600 mb-6">
                {activeTab === 'interested' && "You haven't marked any events as interested yet."}
                {activeTab === 'going' && "You haven't marked any events as going yet."}
                {activeTab === 'purchased' && "You haven't purchased any tickets yet."}
              </p>
              <Link
                href="/events"
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
              >
                Browse Events
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}