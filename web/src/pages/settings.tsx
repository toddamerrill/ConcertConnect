import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { UserIcon, KeyIcon, MapPinIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';
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
}

interface ProfileFormData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  location: {
    city: string;
    state: string;
    country: string;
  };
  musicPreferences: {
    genres: string[];
    maxEventPrice: number;
  };
}

interface PasswordFormData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

const MUSIC_GENRES = [
  'rock', 'pop', 'country', 'hip-hop', 'jazz', 'blues', 'electronic', 
  'classical', 'folk', 'reggae', 'r&b', 'metal', 'punk', 'indie', 'alternative'
];

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const [profileForm, setProfileForm] = useState<ProfileFormData>({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    location: { city: '', state: '', country: 'US' },
    musicPreferences: { genres: [], maxEventPrice: 150 }
  });

  const [passwordForm, setPasswordForm] = useState<PasswordFormData>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
      return;
    }

    if (status === 'authenticated') {
      loadUserProfile();
    }
  }, [status, router]);

  const loadUserProfile = async () => {
    try {
      const response = await ApiClient.makeRequest('/api/auth/me', {
        requireAuth: false,
      });
      const userData = response.data.user;
      setUser(userData);
      
      // Populate form
      setProfileForm({
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        dateOfBirth: userData.dateOfBirth ? userData.dateOfBirth.split('T')[0] : '',
        location: {
          city: userData.location?.city || '',
          state: userData.location?.state || '',
          country: userData.location?.country || 'US'
        },
        musicPreferences: {
          genres: userData.musicPreferences?.genres || [],
          maxEventPrice: userData.musicPreferences?.maxEventPrice || 150
        }
      });
    } catch (error: any) {
      console.error('Error loading profile:', error);
      setErrorMessage('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await ApiClient.makeRequest('/api/auth/me', {
        method: 'PATCH',
        body: profileForm,
        requireAuth: false,
      });

      setSuccessMessage('Profile updated successfully!');
      await loadUserProfile(); // Reload to get updated data
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setErrorMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setErrorMessage('New password must be at least 6 characters long');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await ApiClient.makeRequest('/api/auth/change-password', {
        method: 'POST',
        body: {
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        },
        requireAuth: false,
      });

      setSuccessMessage('Password changed successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleGenreToggle = (genre: string) => {
    setProfileForm(prev => ({
      ...prev,
      musicPreferences: {
        ...prev.musicPreferences,
        genres: prev.musicPreferences.genres.includes(genre)
          ? prev.musicPreferences.genres.filter(g => g !== genre)
          : [...prev.musicPreferences.genres, genre]
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="loading-spinner w-8 h-8 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings - Concert Connect</title>
        <meta name="description" content="Manage your Concert Connect account settings" />
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
                <Link href="/profile" className="text-gray-700 hover:text-primary-600">
                  Profile
                </Link>
                <Link href="/settings" className="text-primary-600 font-medium">
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
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Settings</h2>
                <nav className="space-y-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === 'profile' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <UserIcon className="w-5 h-5 mr-3" />
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveTab('password')}
                    className={`w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors ${
                      activeTab === 'password' 
                        ? 'bg-primary-100 text-primary-800' 
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <KeyIcon className="w-5 h-5 mr-3" />
                    Password
                  </button>
                </nav>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="bg-white rounded-lg shadow-md p-6">
                {/* Success/Error Messages */}
                {successMessage && (
                  <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                    {successMessage}
                  </div>
                )}
                {errorMessage && (
                  <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                    {errorMessage}
                  </div>
                )}

                {/* Profile Tab */}
                {activeTab === 'profile' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h3>
                    <form onSubmit={handleProfileSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-2">
                            First Name
                          </label>
                          <input
                            type="text"
                            id="firstName"
                            value={profileForm.firstName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, firstName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                        <div>
                          <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-2">
                            Last Name
                          </label>
                          <input
                            type="text"
                            id="lastName"
                            value={profileForm.lastName}
                            onChange={(e) => setProfileForm(prev => ({ ...prev, lastName: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <label htmlFor="dateOfBirth" className="block text-sm font-medium text-gray-700 mb-2">
                          Date of Birth
                        </label>
                        <input
                          type="date"
                          id="dateOfBirth"
                          value={profileForm.dateOfBirth}
                          onChange={(e) => setProfileForm(prev => ({ ...prev, dateOfBirth: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <MapPinIcon className="w-5 h-5 mr-2" />
                          Location
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                              City
                            </label>
                            <input
                              type="text"
                              id="city"
                              value={profileForm.location.city}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                location: { ...prev.location, city: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                              State
                            </label>
                            <input
                              type="text"
                              id="state"
                              value={profileForm.location.state}
                              onChange={(e) => setProfileForm(prev => ({
                                ...prev,
                                location: { ...prev.location, state: e.target.value }
                              }))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="border-t pt-6">
                        <h4 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                          <MusicalNoteIcon className="w-5 h-5 mr-2" />
                          Music Preferences
                        </h4>
                        
                        <div className="mb-6">
                          <label className="block text-sm font-medium text-gray-700 mb-3">
                            Favorite Genres
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {MUSIC_GENRES.map((genre) => (
                              <label key={genre} className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={profileForm.musicPreferences.genres.includes(genre)}
                                  onChange={() => handleGenreToggle(genre)}
                                  className="mr-2 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                />
                                <span className="text-sm text-gray-700 capitalize">{genre}</span>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label htmlFor="maxPrice" className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Event Price: ${profileForm.musicPreferences.maxEventPrice}
                          </label>
                          <input
                            type="range"
                            id="maxPrice"
                            min="25"
                            max="500"
                            step="25"
                            value={profileForm.musicPreferences.maxEventPrice}
                            onChange={(e) => setProfileForm(prev => ({
                              ...prev,
                              musicPreferences: { ...prev.musicPreferences, maxEventPrice: parseInt(e.target.value) }
                            }))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-1">
                            <span>$25</span>
                            <span>$500+</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex justify-end pt-6 border-t">
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {saving && <div className="loading-spinner w-4 h-4 mr-2"></div>}
                          {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Password Tab */}
                {activeTab === 'password' && (
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h3>
                    <form onSubmit={handlePasswordSubmit} className="space-y-6">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Current Password
                        </label>
                        <input
                          type="password"
                          id="currentPassword"
                          value={passwordForm.currentPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          New Password
                        </label>
                        <input
                          type="password"
                          id="newPassword"
                          value={passwordForm.newPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                          minLength={6}
                        />
                        <p className="text-xs text-gray-500 mt-1">Must be at least 6 characters long</p>
                      </div>

                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          id="confirmPassword"
                          value={passwordForm.confirmPassword}
                          onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          required
                        />
                      </div>

                      <div className="flex justify-end pt-6 border-t">
                        <button
                          type="submit"
                          disabled={saving}
                          className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                          {saving && <div className="loading-spinner w-4 h-4 mr-2"></div>}
                          {saving ? 'Changing...' : 'Change Password'}
                        </button>
                      </div>
                    </form>
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