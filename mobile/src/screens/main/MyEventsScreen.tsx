import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';

export default function MyEventsScreen() {
  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">My Events Screen</Text>
      <Text variant="bodyMedium">User's saved events, purchases, and attendance history will be shown here.</Text>
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