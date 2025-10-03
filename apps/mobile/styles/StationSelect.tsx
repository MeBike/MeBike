import React from 'react';
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { mockStations } from '../data/mockData';
import { StationCard } from '../components/StationCard';
import type { StationDetailScreenNavigationProp } from '../types/navigation';

export default function StationSelectScreen() {
  const navigation = useNavigation<StationDetailScreenNavigationProp>();

  const handleSelectStation = (stationId: string) => {
    navigation.navigate('StationDetail', { stationId });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Chọn trạm xe</Text>
      <FlatList
        data={mockStations}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <StationCard station={item} onPress={() => handleSelectStation(item.id)} />
        )}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  list: {
    gap: 12,
  },
});
