import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { CalendarIcon, MapPinIcon, HeartIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { ApiClient } from '../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface SocialPost {
  id: string;
  content: string;
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

export default function SocialWidget() {
  const { data: session } = useSession();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (session) {
      loadRecentPosts();
    } else {
      setLoading(false);
    }
  }, [session]);

  const loadRecentPosts = async () => {
    try {
      const response = await ApiClient.makeRequest('/api/social/posts?limit=3', {
        requireAuth: false,
      });
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading recent posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(diffInHours * 60);
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const response = await ApiClient.makeRequest(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        requireAuth: false,
      });

      setPosts(prev => prev.map(post => 
        post.id === postId 
          ? {
              ...post,
              isLiked: response.data.liked,
              _count: {
                ...post._count,
                likes: post._count.likes + (response.data.liked ? 1 : -1)
              }
            }
          : post
      ));
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  if (!session || loading) {
    return null;
  }

  if (posts.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900">Social Activity</h2>
          <Link href="/social" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
            View All →
          </Link>
        </div>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">🎵</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Social Activity</h3>
          <p className="text-gray-600 mb-4">
            Connect with friends to see their concert posts and activities.
          </p>
          <Link
            href="/social"
            className="inline-block bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
          >
            Find Friends
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
        <Link href="/social" className="text-primary-600 hover:text-primary-700 text-sm font-medium">
          View All →
        </Link>
      </div>

      <div className="space-y-6">
        {posts.map((post) => (
          <div key={post.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
            {/* Post Header */}
            <div className="flex items-start space-x-3 mb-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                {post.user.profileImageUrl ? (
                  <img 
                    src={post.user.profileImageUrl} 
                    alt={`${post.user.firstName} ${post.user.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <span className="text-primary-600 text-sm font-medium">
                    {post.user.firstName.charAt(0)}{post.user.lastName.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-gray-900 text-sm">
                  {post.user.firstName} {post.user.lastName}
                </h3>
                <p className="text-xs text-gray-500">{formatDate(post.createdAt)}</p>
              </div>
            </div>

            {/* Post Content */}
            <div className="mb-3">
              <p className="text-gray-900 text-sm line-clamp-3">{post.content}</p>
              
              {post.event && (
                <div className="mt-2 p-2 bg-gray-50 rounded-lg border text-xs">
                  <div className="flex items-start space-x-2">
                    <CalendarIcon className="w-4 h-4 text-primary-600 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{post.event.title}</h4>
                      {post.event.artistName && (
                        <p className="text-gray-600 truncate">{post.event.artistName}</p>
                      )}
                      <div className="flex items-center text-gray-500 mt-1">
                        <MapPinIcon className="w-3 h-3 mr-1" />
                        <span className="truncate">{post.event.venueName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Post Actions */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center space-x-1 text-xs ${
                  post.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                }`}
              >
                {post.isLiked ? (
                  <HeartIconSolid className="w-4 h-4" />
                ) : (
                  <HeartIcon className="w-4 h-4" />
                )}
                <span>{post._count.likes}</span>
              </button>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <ChatBubbleLeftEllipsisIcon className="w-4 h-4" />
                <span>{post._count.comments}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}