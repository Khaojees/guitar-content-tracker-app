import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { tracksApi } from '@/lib/api/endpoints';
import type { Track } from '@/lib/api/types';

export default function TracksScreen() {
  const router = useRouter();
  const { data: tracks, isLoading } = useQuery({
    queryKey: ['tracks'],
    queryFn: tracksApi.getTracks,
  });

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'ready': return '#3B82F6';
      case 'recorded': return '#F59E0B';
      case 'posted': return '#10B981';
      default: return '#6B7280';
    }
  };

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'idea': return 'Idea';
      case 'ready': return 'Ready';
      case 'recorded': return 'Recorded';
      case 'posted': return 'Posted';
      default: return 'Idea';
    }
  };

  const renderTrack = ({ item }: { item: Track }) => (
    <TouchableOpacity
      style={styles.trackCard}
      onPress={() => router.push(`/track/${item.id}`)}
    >
      <View style={styles.trackInfo}>
        <Text style={styles.trackName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.trackArtist} numberOfLines={1}>
          {item.artist.name}
        </Text>
        <View style={styles.trackMeta}>
          {item.albumName && (
            <Text style={styles.trackAlbum} numberOfLines={1}>
              {item.albumName}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.trackRight}>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.trackStatus?.status) },
          ]}
        >
          <Text style={styles.statusText}>
            {getStatusLabel(item.trackStatus?.status)}
          </Text>
        </View>
        <Text style={styles.duration}>{formatDuration(item.duration)}</Text>
        {item.trackStatus?.starred && (
          <IconSymbol name="star.fill" size={16} color="#F59E0B" />
        )}
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!tracks || tracks.length === 0) {
    return (
      <View style={styles.emptyState}>
        <IconSymbol name="music.note.list" size={64} color="#9CA3AF" />
        <Text style={styles.emptyTitle}>No tracks yet</Text>
        <Text style={styles.emptySubtitle}>
          Search and add tracks to get started
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>All Tracks</Text>
        <Text style={styles.headerCount}>{tracks.length} tracks</Text>
      </View>

      <FlatList
        data={tracks}
        renderItem={renderTrack}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerCount: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 4,
  },
  list: {
    padding: 16,
  },
  trackCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  trackInfo: {
    flex: 1,
    marginRight: 12,
  },
  trackName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  trackArtist: {
    fontSize: 14,
    color: '#6366F1',
    marginBottom: 4,
  },
  trackMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  trackAlbum: {
    fontSize: 12,
    color: '#6B7280',
  },
  trackRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  duration: {
    fontSize: 12,
    color: '#6B7280',
    fontFamily: 'monospace',
  },
});
