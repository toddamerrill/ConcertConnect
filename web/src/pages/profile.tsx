import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, UserIcon, Cog6ToothIcon } from '@heroicons/react/24/outline';
import { ApiClient } from '../lib/api';

interface User {
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
  };
  musicPreferences?: {
    genres?: string[];
    maxEventPrice?: number;
  };
  createdAt: string;
}

interface UserEvents {
  interested: any[];
  going: any[];
  purchased: any[];
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [userEvents, setUserEvents] = useState<UserEvents | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      loadUserProfile();
      loadUserEvents();
    }
  }, [status, router]);

  const loadUserProfile = async () => {
    try {
      const response = await ApiClient.makeRequest('/api/auth/me', {
        requireAuth: false, // Session already checked above
      });
      setUser(response.data.user);
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setError('Failed to load profile');
    }
  };

  const loadUserEvents = async () => {
    try {
      const response = await ApiClient.makeRequest('/api/events/user/my-events', {
        requireAuth: false,
      });
      setUserEvents(response.data.events);
    } catch (error: any) {
      console.error('Error loading user events:', error);
      // Don't set error for events, it's not critical
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getEventCount = (type: keyof UserEvents) => {
    return userEvents?.[type]?.length || 0;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl text-gray-400 mb-4">😞</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile Not Found</h1>
          <p className="text-gray-600 mb-6">
            {error || 'Unable to load your profile. Please try again.'}
          </p>
          <Link
            href="/events"
            className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            Go to Events
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>My Profile - Concert Connect</title>
        <meta name="description" content="View and manage your Concert Connect profile" />
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
                <Link href="/profile" className="text-primary-600 font-medium">
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="text-center">
                  {/* Profile Image */}
                  <div className="w-24 h-24 mx-auto mb-4 bg-primary-100 rounded-full flex items-center justify-center">
                    {user.profileImageUrl ? (
                      <img
                        src={user.profileImageUrl}
                        alt={`${user.firstName} ${user.lastName}`}
                        className="w-24 h-24 rounded-full object-cover"
                      />
                    ) : (
                      <UserIcon className="w-12 h-12 text-primary-600" />
                    )}
                  </div>

                  {/* Name */}
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    {user.firstName} {user.lastName}
                  </h1>

                  {/* Email */}
                  <p className="text-gray-600 mb-4">{user.email}</p>

                  {/* Edit Button */}
                  <Link
                    href="/settings"
                    className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                  >
                    <Cog6ToothIcon className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Link>
                </div>

                {/* Profile Details */}
                <div className="mt-6 space-y-4">
                  {user.location && (user.location.city || user.location.state) && (
                    <div className="flex items-center text-gray-700">
                      <MapPinIcon className="w-5 h-5 mr-3 text-gray-400" />
                      <span>
                        {user.location.city && user.location.state
                          ? `${user.location.city}, ${user.location.state}`
                          : user.location.city || user.location.state}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center text-gray-700">
                    <CalendarIcon className="w-5 h-5 mr-3 text-gray-400" />
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>

                  {user.musicPreferences?.genres && user.musicPreferences.genres.length > 0 && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-2">Music Preferences</h3>
                      <div className="flex flex-wrap gap-2">
                        {user.musicPreferences.genres.map((genre, index) => (
                          <span
                            key={index}
                            className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full"
                          >
                            {genre.charAt(0).toUpperCase() + genre.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {user.musicPreferences?.maxEventPrice && (
                    <div className="mt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">Max Event Price</h3>
                      <p className="text-gray-600">${user.musicPreferences.maxEventPrice}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Event Statistics */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Event Activity</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">
                      {getEventCount('interested')}
                    </div>
                    <div className="text-sm text-gray-600">Interested</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">
                      {getEventCount('going')}
                    </div>
                    <div className="text-sm text-gray-600">Going</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">
                      {getEventCount('purchased')}
                    </div>
                    <div className="text-sm text-gray-600">Purchased</div>
                  </div>
                </div>

                <div className="mt-6">
                  <Link
                    href="/my-events"
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    View All My Events →
                  </Link>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Recent Activity</h2>
                
                {userEvents && Object.values(userEvents).some(events => events.length > 0) ? (
                  <div className="space-y-4">
                    {/* Show recent events from all categories */}
                    {Object.entries(userEvents).map(([type, events]) => 
                      events.slice(0, 3).map((event, index) => (
                        <div key={`${type}-${index}`} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">{event.title}</h3>
                            <p className="text-sm text-gray-600">{event.venueName}</p>
                          </div>
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            type === 'interested' 
                              ? 'bg-yellow-100 text-yellow-800'
                              : type === 'going' 
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {type}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-gray-400 text-4xl mb-4">🎵</div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Activity Yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start exploring events to see your activity here.
                    </p>
                    <Link
                      href="/events"
                      className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                    >
                      Browse Events
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}