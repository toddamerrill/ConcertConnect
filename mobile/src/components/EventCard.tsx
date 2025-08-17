import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Text, Card, Chip, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface Event {
  id: string;
  title: string;
  artistName: string;
  venueName: string;
  eventDate: string;
  imageUrl?: string;
  priceRange?: {
    min: number;
    max: number;
    currency: string;
  };
  userInteractions?: string[];
}

interface EventCardProps {
  event: Event;
  onPress: () => void;
  style?: any;
  showInteractionButtons?: boolean;
  onInteractionPress?: (eventId: string, type: 'interested' | 'going') => void;
}

export default function EventCard({ 
  event, 
  onPress, 
  style,
  showInteractionButtons = false,
  onInteractionPress 
}: EventCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      time: date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const formatPrice = (priceRange: any) => {
    if (!priceRange) return 'Price TBA';
    return `$${priceRange.min} - $${priceRange.max}`;
  };

  const isInterested = event.userInteractions?.includes('interested');
  const isGoing = event.userInteractions?.includes('going');
  const isPurchased = event.userInteractions?.includes('purchased');

  const { day, date, time } = formatDate(event.eventDate);

  return (
    <TouchableOpacity onPress={onPress} style={style}>
      <Card style={styles.card}>
        <View style={styles.content}>
          {/* Date Section */}
          <View style={styles.dateSection}>
            <Text variant="labelSmall" style={styles.dayText}>{day}</Text>
            <Text variant="bodyMedium" style={styles.dateText}>{date}</Text>
            <Text variant="labelSmall" style={styles.timeText}>{time}</Text>
          </View>

          {/* Event Image */}
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={styles.image} />
          ) : (
            <View style={[styles.image, styles.placeholderImage]}>
              <MaterialCommunityIcons name="music" size={24} color="#6b7280" />
            </View>
          )}

          {/* Event Details */}
          <View style={styles.details}>
            <Text variant="titleMedium" style={styles.title} numberOfLines={2}>
              {event.title}
            </Text>
            
            <Text variant="bodyMedium" style={styles.artist} numberOfLines={1}>
              {event.artistName}
            </Text>
            
            <View style={styles.venueRow}>
              <MaterialCommunityIcons name="map-marker" size={16} color="#6b7280" />
              <Text variant="bodySmall" style={styles.venue} numberOfLines={1}>
                {event.venueName}
              </Text>
            </View>

            <Text variant="bodyMedium" style={styles.price}>
              {formatPrice(event.priceRange)}
            </Text>

            {/* Status Chips */}
            <View style={styles.statusChips}>
              {isPurchased && (
                <Chip icon="ticket" style={styles.purchasedChip} textStyle={styles.chipText}>
                  Purchased
                </Chip>
              )}
              {isGoing && !isPurchased && (
                <Chip icon="check" style={styles.goingChip} textStyle={styles.chipText}>
                  Going
                </Chip>
              )}
              {isInterested && !isGoing && !isPurchased && (
                <Chip icon="heart" style={styles.interestedChip} textStyle={styles.chipText}>
                  Interested
                </Chip>
              )}
            </View>

            {/* Interaction Buttons */}
            {showInteractionButtons && onInteractionPress && (
              <View style={styles.actionButtons}>
                <IconButton
                  icon={isInterested ? 'heart' : 'heart-outline'}
                  iconColor={isInterested ? '#ef4444' : '#6b7280'}
                  size={24}
                  onPress={() => onInteractionPress(event.id, 'interested')}
                />
                <IconButton
                  icon={isGoing ? 'check-circle' : 'check-circle-outline'}
                  iconColor={isGoing ? '#10b981' : '#6b7280'}
                  size={24}
                  onPress={() => onInteractionPress(event.id, 'going')}
                />
              </View>
            )}
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    elevation: 2,
    backgroundColor: '#ffffff',
  },
  content: {
    flexDirection: 'row',
    padding: 16,
  },
  dateSection: {
    width: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
  },
  dayText: {
    color: '#6b7280',
    textTransform: 'uppercase',
  },
  dateText: {
    fontWeight: 'bold',
    color: '#111827',
    marginVertical: 2,
  },
  timeText: {
    color: '#6b7280',
    fontSize: 10,
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 16,
  },
  placeholderImage: {
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  details: {
    flex: 1,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  artist: {
    color: '#6b7280',
    marginBottom: 4,
  },
  venueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  venue: {
    color: '#6b7280',
    marginLeft: 4,
    flex: 1,
  },
  price: {
    color: '#0ea5e9',
    fontWeight: '600',
    marginBottom: 8,
  },
  statusChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  interestedChip: {
    backgroundColor: '#fef2f2',
    borderColor: '#ef4444',
  },
  goingChip: {
    backgroundColor: '#f0fdf4',
    borderColor: '#10b981',
  },
  purchasedChip: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  chipText: {
    fontSize: 10,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 4,
  },
});