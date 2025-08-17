import React, { useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { Text, Card, Button, ActivityIndicator } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';

import { RootState, AppDispatch } from '../../store/store';
import { fetchFeaturedEvents } from '../../store/slices/eventsSlice';
import EventCard from '../../components/EventCard';

export default function HomeScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const { featuredEvents, isLoading } = useSelector((state: RootState) => state.events);
  const { user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    dispatch(fetchFeaturedEvents(8));
  }, [dispatch]);

  const handleRefresh = () => {
    dispatch(fetchFeaturedEvents(8));
  };

  const handleEventPress = (eventId: string) => {
    navigation.navigate('EventDetail' as never, { eventId } as never);
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl
          refreshing={isLoading}
          onRefresh={handleRefresh}
          colors={['#0ea5e9']}
        />
      }
    >
      {/* Welcome Section */}
      <Card style={styles.welcomeCard}>
        <Card.Content>
          <Text variant="headlineSmall" style={styles.welcomeTitle}>
            Welcome back, {user?.firstName}! 👋
          </Text>
          <Text variant="bodyMedium" style={styles.welcomeSubtitle}>
            Discover amazing live music events near you
          </Text>
        </Card.Content>
      </Card>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <Button
          mode="contained"
          onPress={() => navigation.navigate('Events' as never)}
          style={styles.actionButton}
          icon="magnify"
        >
          Search Events
        </Button>
        <Button
          mode="outlined"
          onPress={() => navigation.navigate('Social' as never)}
          style={styles.actionButton}
          icon="account-group"
        >
          See Friends
        </Button>
      </View>

      {/* Featured Events */}
      <View style={styles.section}>
        <Text variant="headlineSmall" style={styles.sectionTitle}>
          Featured Events
        </Text>
        
        {isLoading && featuredEvents.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0ea5e9" />
            <Text style={styles.loadingText}>Loading events...</Text>
          </View>
        ) : featuredEvents.length > 0 ? (
          <View>
            {featuredEvents.slice(0, 4).map((event) => (
              <EventCard
                key={event.id}
                event={event}
                onPress={() => handleEventPress(event.id)}
                style={styles.eventCard}
              />
            ))}
            
            <Button
              mode="text"
              onPress={() => navigation.navigate('Events' as never)}
              style={styles.viewAllButton}
            >
              View All Events
            </Button>
          </View>
        ) : (
          <Card style={styles.emptyCard}>
            <Card.Content>
              <Text variant="bodyLarge" style={styles.emptyText}>
                No featured events available at the moment.
              </Text>
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Events' as never)}
                style={styles.browseButton}
              >
                Browse All Events
              </Button>
            </Card.Content>
          </Card>
        )}
      </View>

      {/* Discovery Tips */}
      <Card style={styles.tipsCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.tipsTitle}>
            💡 Discovery Tips
          </Text>
          <Text variant="bodyMedium" style={styles.tipsText}>
            • Update your music preferences for better recommendations{'\n'}
            • Connect with friends to see what events they're attending{'\n'}
            • Save events you're interested in to get updates
          </Text>
        </Card.Content>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  contentContainer: {
    padding: 16,
  },
  welcomeCard: {
    marginBottom: 16,
    backgroundColor: '#0ea5e9',
  },
  welcomeTitle: {
    color: '#ffffff',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: '#e0f2fe',
  },
  quickActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    color: '#6b7280',
  },
  eventCard: {
    marginBottom: 12,
  },
  viewAllButton: {
    marginTop: 8,
  },
  emptyCard: {
    alignItems: 'center',
    padding: 16,
  },
  emptyText: {
    textAlign: 'center',
    color: '#6b7280',
    marginBottom: 16,
  },
  browseButton: {
    width: '100%',
  },
  tipsCard: {
    backgroundColor: '#f0f9ff',
    borderColor: '#0ea5e9',
    borderWidth: 1,
  },
  tipsTitle: {
    color: '#0369a1',
    fontWeight: '600',
    marginBottom: 8,
  },
  tipsText: {
    color: '#0c4a6e',
    lineHeight: 20,
  },
});