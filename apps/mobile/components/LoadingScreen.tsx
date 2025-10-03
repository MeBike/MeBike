
import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { BikeColors } from '@/constants/BikeColors';
import { IconSymbol } from './IconSymbol';

export const LoadingScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <IconSymbol name="bicycle" size={60} color={BikeColors.primary} />
      <Text style={styles.title}>BikeShare</Text>
      <ActivityIndicator size="large" color={BikeColors.primary} style={styles.loader} />
      <Text style={styles.subtitle}>Đang tải...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: BikeColors.primary,
    marginTop: 16,
    marginBottom: 32,
  },
  loader: {
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: BikeColors.textSecondary,
  },
});
