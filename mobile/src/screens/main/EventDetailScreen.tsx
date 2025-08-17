import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function EventDetailScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Event Detail Screen</Text>
      <Text variant="bodyMedium">Detailed event information and ticket purchasing will be implemented here.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f9fafb',
  },
});