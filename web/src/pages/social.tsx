import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import {
  UserPlusIcon,
  UserGroupIcon,
  ChatBubbleLeftEllipsisIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  CalendarIcon,
  MapPinIcon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { HeartIcon as HeartIconSolid } from '@heroicons/react/24/solid';
import { ApiClient } from '../lib/api';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  profileImageUrl?: string;
}

interface FriendRequest {
  id: string;
  requester: User;
  createdAt: string;
}

interface SocialPost {
  id: string;
  content: string;
  imageUrl?: string;
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

export default function SocialPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'feed' | 'friends' | 'requests'>('feed');
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  
  // Feed state
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [newPost, setNewPost] = useState('');
  
  // Friends state
  const [friends, setFriends] = useState<User[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      loadInitialData();
    }
  }, [status, router, activeTab]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'feed') {
        await loadFeed();
      } else if (activeTab === 'friends') {
        await loadFriends();
      } else if (activeTab === 'requests') {
        await loadFriendRequests();
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFeed = async () => {
    try {
      const response = await ApiClient.getSocialFeed();
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error loading feed:', error);
    }
  };

  const loadFriends = async () => {
    try {
      const response = await ApiClient.makeRequest('/api/social/friends', {
        requireAuth: false,
      });
      setFriends(response.data.friends || []);
    } catch (error) {
      console.error('Error loading friends:', error);
    }
  };

  const loadFriendRequests = async () => {
    try {
      const response = await ApiClient.makeRequest('/api/social/friends/requests', {
        requireAuth: false,
      });
      setFriendRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error loading friend requests:', error);
    }
  };

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      setSearching(true);
      const response = await ApiClient.makeRequest(`/api/users/search?q=${encodeURIComponent(query)}`, {
        requireAuth: false,
      });
      setSearchResults(response.data.users || []);
    } catch (error) {
      console.error('Error searching users:', error);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const createPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.trim() || posting) return;

    try {
      setPosting(true);
      const response = await ApiClient.createPost({
        content: newPost.trim()
      });
      
      setPosts(prev => [response.data.post, ...prev]);
      setNewPost('');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    } finally {
      setPosting(false);
    }
  };

  const sendFriendRequest = async (userId: string) => {
    try {
      await ApiClient.makeRequest('/api/social/friends/request', {
        method: 'POST',
        body: { userId },
        requireAuth: false,
      });
      
      // Remove user from search results
      setSearchResults(prev => prev.filter(user => user.id !== userId));
      alert('Friend request sent!');
    } catch (error) {
      console.error('Error sending friend request:', error);
      alert('Failed to send friend request. Please try again.');
    }
  };

  const respondToFriendRequest = async (requestId: string, action: 'accept' | 'decline') => {
    try {
      await ApiClient.makeRequest(`/api/social/friends/request/${requestId}`, {
        method: 'PATCH',
        body: { action },
        requireAuth: false,
      });
      
      // Remove request from list
      setFriendRequests(prev => prev.filter(req => req.id !== requestId));
      
      if (action === 'accept') {
        // Reload friends if on friends tab
        if (activeTab === 'friends') {
          await loadFriends();
        }
        alert('Friend request accepted!');
      } else {
        alert('Friend request declined.');
      }
    } catch (error) {
      console.error('Error responding to friend request:', error);
      alert('Failed to respond to friend request. Please try again.');
    }
  };

  const toggleLike = async (postId: string) => {
    try {
      const response = await ApiClient.makeRequest(`/api/social/posts/${postId}/like`, {
        method: 'POST',
        requireAuth: false,
      });

      // Update post like status
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

  if (loading && activeTab !== 'feed') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading social data...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Social - Concert Connect</title>
        <meta name="description" content="Connect with friends and share your concert experiences" />
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
                <Link href="/my-events" className="text-gray-700 hover:text-primary-600">
                  My Events
                </Link>
                <Link href="/social" className="text-primary-600 font-medium">
                  Social
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
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
            <div className="lg:w-1/4">
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Social</h2>
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('feed')}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === 'feed' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <ChatBubbleLeftEllipsisIcon className="w-5 h-5 mr-3" />
                    Feed
                  </button>
                  <button
                    onClick={() => setActiveTab('friends')}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === 'friends' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <UserGroupIcon className="w-5 h-5 mr-3" />
                    Friends ({friends.length})
                  </button>
                  <button
                    onClick={() => setActiveTab('requests')}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === 'requests' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <UserPlusIcon className="w-5 h-5 mr-3" />
                    Requests 
                    {friendRequests.length > 0 && (
                      <span className="ml-2 bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full">
                        {friendRequests.length}
                      </span>
                    )}
                  </button>
                </nav>
              </div>

              {/* Search Users */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">Find Friends</h3>
                <div className="relative mb-4">
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      searchUsers(e.target.value);
                    }}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>

                {searching && (
                  <div className="text-center py-4">
                    <div className="loading-spinner w-5 h-5 mx-auto"></div>
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="space-y-2">
                    {searchResults.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                            {user.profileImageUrl ? (
                              <img 
                                src={user.profileImageUrl} 
                                alt={`${user.firstName} ${user.lastName}`}
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-600 text-sm font-medium">
                                {user.firstName.charAt(0)}{user.lastName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                        <button
                          onClick={() => sendFriendRequest(user.id)}
                          className="text-primary-600 hover:text-primary-700"
                          title="Send friend request"
                        >
                          <UserPlusIcon className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {searchQuery && !searching && searchResults.length === 0 && (
                  <p className="text-gray-500 text-sm text-center py-4">
                    No users found matching "{searchQuery}"
                  </p>
                )}
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              {/* Feed Tab */}
              {activeTab === 'feed' && (
                <div className="space-y-6">
                  {/* Create Post */}
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <form onSubmit={createPost}>
                      <div className="flex space-x-4">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-primary-600 font-medium">
                            {session?.user?.name?.charAt(0) || 'U'}
                          </span>
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={newPost}
                            onChange={(e) => setNewPost(e.target.value)}
                            placeholder="What's on your mind about concerts?"
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                            maxLength={1000}
                          />
                          <div className="flex justify-between items-center mt-3">
                            <span className="text-xs text-gray-500">
                              {newPost.length}/1000 characters
                            </span>
                            <button
                              type="submit"
                              disabled={!newPost.trim() || posting}
                              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                            >
                              {posting && <div className="loading-spinner w-4 h-4 mr-2"></div>}
                              <PlusIcon className="w-4 h-4 mr-1" />
                              Post
                            </button>
                          </div>
                        </div>
                      </div>
                    </form>
                  </div>

                  {/* Posts Feed */}
                  {loading ? (
                    <div className="text-center py-12">
                      <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
                      <p className="text-gray-600">Loading feed...</p>
                    </div>
                  ) : posts.length > 0 ? (
                    posts.map((post) => (
                      <div key={post.id} className="bg-white rounded-lg shadow-md p-6">
                        {/* Post Header */}
                        <div className="flex items-start space-x-3 mb-4">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {post.user.profileImageUrl ? (
                              <img 
                                src={post.user.profileImageUrl} 
                                alt={`${post.user.firstName} ${post.user.lastName}`}
                                className="w-10 h-10 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-600 font-medium">
                                {post.user.firstName.charAt(0)}{post.user.lastName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900">
                              {post.user.firstName} {post.user.lastName}
                            </h3>
                            <p className="text-sm text-gray-500">{formatDate(post.createdAt)}</p>
                          </div>
                        </div>

                        {/* Post Content */}
                        <div className="mb-4">
                          <p className="text-gray-900 whitespace-pre-wrap">{post.content}</p>
                          
                          {post.event && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg border">
                              <div className="flex items-start space-x-3">
                                <CalendarIcon className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
                                <div>
                                  <h4 className="font-medium text-gray-900">{post.event.title}</h4>
                                  <p className="text-sm text-gray-600">{post.event.artistName}</p>
                                  <div className="flex items-center text-sm text-gray-500 mt-1">
                                    <MapPinIcon className="w-4 h-4 mr-1" />
                                    {post.event.venueName}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Post Actions */}
                        <div className="flex items-center space-x-6 pt-3 border-t border-gray-200">
                          <button
                            onClick={() => toggleLike(post.id)}
                            className={`flex items-center space-x-2 ${
                              post.isLiked ? 'text-red-600' : 'text-gray-500 hover:text-red-600'
                            }`}
                          >
                            {post.isLiked ? (
                              <HeartIconSolid className="w-5 h-5" />
                            ) : (
                              <HeartIcon className="w-5 h-5" />
                            )}
                            <span className="text-sm">{post._count.likes}</span>
                          </button>
                          <button className="flex items-center space-x-2 text-gray-500 hover:text-primary-600">
                            <ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
                            <span className="text-sm">{post._count.comments}</span>
                          </button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                      <div className="text-gray-400 text-6xl mb-4">🎵</div>
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No Posts Yet</h3>
                      <p className="text-gray-600 mb-6">
                        Your social feed will show posts from you and your friends. Start by creating a post or adding some friends!
                      </p>
                      <Link
                        href="/events"
                        className="inline-block bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700"
                      >
                        Discover Events to Share
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    My Friends ({friends.length})
                  </h2>
                  
                  {friends.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {friends.map((friend) => (
                        <div key={friend.id} className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                          <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                            {friend.profileImageUrl ? (
                              <img 
                                src={friend.profileImageUrl} 
                                alt={`${friend.firstName} ${friend.lastName}`}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <span className="text-primary-600 font-medium">
                                {friend.firstName.charAt(0)}{friend.lastName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-medium text-gray-900">
                              {friend.firstName} {friend.lastName}
                            </h3>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserGroupIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No Friends Yet</h3>
                      <p className="text-gray-600 mb-6">
                        Start connecting with other concert-goers! Use the search feature to find and add friends.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Friend Requests Tab */}
              {activeTab === 'requests' && (
                <div className="bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-6">
                    Friend Requests ({friendRequests.length})
                  </h2>
                  
                  {friendRequests.length > 0 ? (
                    <div className="space-y-4">
                      {friendRequests.map((request) => (
                        <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                              {request.requester.profileImageUrl ? (
                                <img 
                                  src={request.requester.profileImageUrl} 
                                  alt={`${request.requester.firstName} ${request.requester.lastName}`}
                                  className="w-12 h-12 rounded-full object-cover"
                                />
                              ) : (
                                <span className="text-primary-600 font-medium">
                                  {request.requester.firstName.charAt(0)}{request.requester.lastName.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">
                                {request.requester.firstName} {request.requester.lastName}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Sent {formatDate(request.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className="flex space-x-3">
                            <button
                              onClick={() => respondToFriendRequest(request.id, 'accept')}
                              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => respondToFriendRequest(request.id, 'decline')}
                              className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400"
                            >
                              Decline
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <UserPlusIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-medium text-gray-900 mb-2">No Friend Requests</h3>
                      <p className="text-gray-600">
                        When someone sends you a friend request, it will appear here.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}