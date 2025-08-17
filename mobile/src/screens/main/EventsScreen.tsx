import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function EventsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Events Screen</Text>
      <Text variant="bodyMedium">Search and discover events functionality will be implemented here.</Text>
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