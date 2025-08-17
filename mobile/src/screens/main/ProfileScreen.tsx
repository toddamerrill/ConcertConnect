import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../../store/store';
import { logout } from '../../store/slices/authSlice';

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);

  const handleLogout = () => {
    dispatch(logout());
  };

  return (
    <View style={styles.container}>
      <Text variant="headlineSmall">Profile Screen</Text>
      <Text variant="bodyMedium" style={styles.text}>
        Welcome, {user?.firstName} {user?.lastName}!
      </Text>
      <Text variant="bodyMedium" style={styles.text}>
        Email: {user?.email}
      </Text>
      <Text variant="bodyMedium" style={styles.description}>
        Profile management, settings, and preferences will be implemented here.
      </Text>
      
      <Button
        mode="contained"
        onPress={handleLogout}
        style={styles.logoutButton}
        buttonColor="#ef4444"
      >
        Sign Out
      </Button>
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
  text: {
    marginVertical: 8,
  },
  description: {
    textAlign: 'center',
    marginVertical: 16,
    color: '#6b7280',
  },
  logoutButton: {
    marginTop: 24,
  },
});