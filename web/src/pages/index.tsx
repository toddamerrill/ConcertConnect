import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import Layout from '../components/Layout';
import { ApiClient } from '../lib/api';
import { CalendarIcon, MapPinIcon, TicketIcon, UserGroupIcon } from '@heroicons/react/24/outline';

interface Event {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  imageUrl: string;
  priceRange: {
    min: number;
    max: number;
    currency: string;
  };
}

export default function HomePage() {
  const { data: session } = useSession();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeaturedEvents = async () => {
      try {
        const response = await ApiClient.getFeaturedEvents(8);
        setFeaturedEvents((response as any).data?.events || []);
      } catch (error) {
        console.error('Error fetching featured events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedEvents();
  }, []);

  const formatPrice = (priceRange: any) => {
    if (!priceRange) return 'Price TBA';
    return `$${priceRange.min} - $${priceRange.max}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <Layout>
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl text-white p-8 mb-12">
        <div className="max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            Discover Live Music
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Find concerts, connect with friends, and create unforgettable memories
          </p>
          
          {!session ? (
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/auth/signup"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Get Started
              </Link>
              <Link
                href="/events"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Browse Events
              </Link>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/events"
                className="bg-white text-primary-600 hover:bg-gray-100 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Discover Events
              </Link>
              <Link
                href="/social"
                className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-semibold py-3 px-6 rounded-lg transition-colors"
              >
                Connect with Friends
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center p-6">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <CalendarIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Event Discovery</h3>
          <p className="text-gray-600">
            AI-powered recommendations help you discover concerts you'll love based on your music taste
          </p>
        </div>

        <div className="text-center p-6">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserGroupIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Social Connection</h3>
          <p className="text-gray-600">
            Connect with friends, share your concert experiences, and discover events together
          </p>
        </div>

        <div className="text-center p-6">
          <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <TicketIcon className="h-8 w-8 text-primary-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Easy Booking</h3>
          <p className="text-gray-600">
            Seamless ticket purchasing with transparent pricing and secure payment processing
          </p>
        </div>
      </div>

      {/* Featured Events */}
      <div className="mb-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">Featured Events</h2>
          <Link
            href="/events"
            className="text-primary-600 hover:text-primary-700 font-medium"
          >
            View All Events →
          </Link>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="loading-spinner w-8 h-8"></div>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredEvents.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="card hover:shadow-lg transition-shadow cursor-pointer"
              >
                {event.imageUrl && (
                  <img
                    src={event.imageUrl}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-lg mb-4"
                  />
                )}
                <h3 className="font-semibold text-lg mb-2 line-clamp-2">
                  {event.title}
                </h3>
                <p className="text-gray-600 mb-2">{event.artistName}</p>
                
                <div className="flex items-center text-sm text-gray-500 mb-1">
                  <MapPinIcon className="h-4 w-4 mr-1" />
                  {event.venueName}
                </div>
                
                <div className="flex items-center text-sm text-gray-500 mb-3">
                  <CalendarIcon className="h-4 w-4 mr-1" />
                  {formatDate(event.eventDate)}
                </div>
                
                <div className="text-primary-600 font-semibold">
                  {formatPrice(event.priceRange)}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Call to Action */}
      {!session && (
        <div className="bg-gray-100 rounded-2xl p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to discover your next favorite concert?
          </h2>
          <p className="text-gray-600 mb-6">
            Join Concert Connect today and never miss out on amazing live music experiences
          </p>
          <Link
            href="/auth/signup"
            className="btn-primary text-lg px-8 py-3"
          >
            Sign Up Free
          </Link>
        </div>
      )}
    </Layout>
  );
}