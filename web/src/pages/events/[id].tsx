import { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';
import { ApiClient } from '../../lib/api';
import { CalendarIcon, MapPinIcon, TicketIcon, UserGroupIcon, ShareIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  description?: string;
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
  ticketUrl?: string;
  userInteractions?: string[];
}

export default function EventDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { data: session } = useSession();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareContent, setShareContent] = useState('');
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadEvent(id);
    }
  }, [id]);

  const loadEvent = async (eventId: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await ApiClient.getEvent(eventId);
      setEvent(response.data.event);
    } catch (error: any) {
      console.error('Error loading event:', error);
      setError(error.message || 'Failed to load event');
    } finally {
      setLoading(false);
    }
  };

  const handleInteraction = async (type: 'interested' | 'going' | 'purchased') => {
    if (!session || !event) return;

    try {
      if (event.userInteractions?.includes(type)) {
        await ApiClient.removeEventInterest(event.id, type);
        setEvent(prev => prev ? {
          ...prev,
          userInteractions: prev.userInteractions?.filter(i => i !== type) || []
        } : null);
      } else {
        await ApiClient.markEventInterest(event.id, type);
        setEvent(prev => prev ? {
          ...prev,
          userInteractions: [...(prev.userInteractions || []), type]
        } : null);
      }
    } catch (error: any) {
      console.error('Error updating interest:', error);
      alert('Failed to update interest. Please try again.');
    }
  };

  const handleShare = () => {
    if (!event) return;
    
    // Generate default share content
    const defaultContent = `Check out this event: ${event.title}${event.artistName ? ` by ${event.artistName}` : ''}! 🎵`;
    setShareContent(defaultContent);
    setShowShareModal(true);
  };

  const submitShare = async () => {
    if (!shareContent.trim() || !event || sharing) return;

    try {
      setSharing(true);
      await ApiClient.createPost({
        content: shareContent.trim(),
        eventId: event.id 
      });
      
      setShowShareModal(false);
      setShareContent('');
      
      // Show success message
      alert('Event shared to your social feed!');
    } catch (error: any) {
      console.error('Error sharing event:', error);
      alert('Failed to share event. Please try again.');
    } finally {
      setSharing(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading event details...</p>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'The event you\'re looking for doesn\'t exist or has been removed.'}
          </p>
          <Link
            href="/events"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Browse Other Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>{event.title} - Concert Connect</title>
        <meta name="description" content={event.description || `${event.artistName} at ${event.venueName}`} />
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
          {/* Breadcrumb */}
          <nav className="mb-8">
            <Link href="/events" className="text-primary-600 hover:text-primary-700">
              ← Back to Events
            </Link>
          </nav>

          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="md:flex">
              {/* Event Image */}
              {event.imageUrl && (
                <div className="md:w-1/2">
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-64 md:h-full object-cover"
                  />
                </div>
              )}

              {/* Event Details */}
              <div className={`${event.imageUrl ? 'md:w-1/2' : 'w-full'} p-8`}>
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">{event.title}</h1>
                  {event.artistName && (
                    <p className="text-2xl text-primary-600 mb-4">{event.artistName}</p>
                  )}
                  {event.description && (
                    <p className="text-gray-700 mb-6">{event.description}</p>
                  )}
                </div>

                {/* Event Info */}
                <div className="space-y-4 mb-8">
                  {event.eventDate && (
                    <div className="flex items-center text-gray-700">
                      <CalendarIcon className="h-6 w-6 mr-3 text-primary-600" />
                      <div>
                        <div className="font-semibold">{formatDate(event.eventDate)}</div>
                        <div className="text-sm text-gray-600">{formatTime(event.eventDate)}</div>
                      </div>
                    </div>
                  )}
                  
                  {event.venueName && (
                    <div className="flex items-start text-gray-700">
                      <MapPinIcon className="h-6 w-6 mr-3 mt-1 text-primary-600 flex-shrink-0" />
                      <div>
                        <div className="font-semibold">{event.venueName}</div>
                        {event.venueAddress && (
                          <div className="text-sm text-gray-600">
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
                    <div className="flex items-center text-gray-700">
                      <TicketIcon className="h-6 w-6 mr-3 text-primary-600" />
                      <div>
                        <div className="font-semibold">
                          ${event.priceRange.min} - ${event.priceRange.max}
                        </div>
                        <div className="text-sm text-gray-600">Price range</div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Genre Tag */}
                {event.genre && (
                  <div className="mb-8">
                    <span className="inline-block bg-primary-100 text-primary-800 text-sm px-3 py-1 rounded-full">
                      {event.genre.charAt(0).toUpperCase() + event.genre.slice(1)}
                    </span>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-4">
                  {event.ticketUrl && (
                    <a
                      href={event.ticketUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block w-full bg-primary-600 text-white text-center font-semibold py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors"
                    >
                      Buy Tickets
                    </a>
                  )}

                  {session && (
                    <>
                      <div className="grid grid-cols-3 gap-2 mb-3">
                        <button
                          onClick={() => handleInteraction('interested')}
                          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            event.userInteractions?.includes('interested')
                              ? 'bg-yellow-100 text-yellow-800 border-2 border-yellow-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-yellow-50 border-2 border-transparent hover:border-yellow-300'
                          }`}
                        >
                          {event.userInteractions?.includes('interested') ? '★ Interested' : 'Interested'}
                        </button>
                        
                        <button
                          onClick={() => handleInteraction('going')}
                          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            event.userInteractions?.includes('going')
                              ? 'bg-green-100 text-green-800 border-2 border-green-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-green-50 border-2 border-transparent hover:border-green-300'
                          }`}
                        >
                          <UserGroupIcon className="h-4 w-4 inline mr-1" />
                          {event.userInteractions?.includes('going') ? 'Going' : 'Going'}
                        </button>
                        
                        <button
                          onClick={() => handleInteraction('purchased')}
                          className={`py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                            event.userInteractions?.includes('purchased')
                              ? 'bg-blue-100 text-blue-800 border-2 border-blue-300'
                              : 'bg-gray-100 text-gray-700 hover:bg-blue-50 border-2 border-transparent hover:border-blue-300'
                          }`}
                        >
                          <TicketIcon className="h-4 w-4 inline mr-1" />
                          {event.userInteractions?.includes('purchased') ? 'Purchased' : 'Purchased'}
                        </button>
                      </div>
                      
                      <button
                        onClick={handleShare}
                        className="w-full py-2 px-4 rounded-lg text-sm font-medium bg-purple-100 text-purple-800 hover:bg-purple-200 transition-colors border-2 border-transparent hover:border-purple-300"
                      >
                        <ShareIcon className="h-4 w-4 inline mr-1" />
                        Share Event
                      </button>
                    </>
                  )}

                  {!session && (
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Sign in to track your interest in this event</p>
                      <Link
                        href="/auth/signin"
                        className="inline-block bg-primary-600 text-white font-semibold py-2 px-6 rounded-lg hover:bg-primary-700"
                      >
                        Sign In
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Share Modal */}
        {showShareModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Share Event</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="mb-4">
                <label htmlFor="shareContent" className="block text-sm font-medium text-gray-700 mb-2">
                  What do you want to say about this event?
                </label>
                <textarea
                  id="shareContent"
                  value={shareContent}
                  onChange={(e) => setShareContent(e.target.value)}
                  placeholder="Share your thoughts about this event..."
                  rows={4}
                  maxLength={1000}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {shareContent.length}/1000 characters
                </p>
              </div>

              {event && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-start space-x-3">
                    <CalendarIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium text-gray-900">{event.title}</h4>
                      {event.artistName && (
                        <p className="text-sm text-gray-600">{event.artistName}</p>
                      )}
                      <div className="flex items-center text-sm text-gray-500 mt-1">
                        <MapPinIcon className="w-4 h-4 mr-1" />
                        {event.venueName}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowShareModal(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={submitShare}
                  disabled={!shareContent.trim() || sharing}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {sharing && <div className="loading-spinner w-4 h-4 mr-2"></div>}
                  Share
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}