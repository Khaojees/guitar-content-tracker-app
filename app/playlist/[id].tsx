import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { playlistsApi } from '@/lib/api/endpoints';
import { apiClient } from '@/lib/api/client';
import type { Track } from '@/lib/api/types';

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const playlistId = parseInt(id as string);

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['playlist', playlistId],
    queryFn: () => playlistsApi.getPlaylist(playlistId),
  });

  const removeTrackMutation = useMutation({
    mutationFn: async (trackId: number) => {
      const response = await apiClient.delete(
        `/api/playlist/${playlistId}/track/${trackId}`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
      Alert.alert('Success', 'Track removed from playlist');
    },
    onError: () => {
      Alert.alert('Error', 'Failed to remove track');
    },
  });

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getTotalDuration = () => {
    if (!playlist) return 0;
    return playlist.playlistTracks.reduce(
      (sum, pt) => sum + (pt.track.duration || 0),
      0
    );
  };

  const formatTotalDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  const handleRemoveTrack = (trackId: number, trackName: string) => {
    Alert.alert(
      'Remove Track',
      `Remove "${trackName}" from this playlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => removeTrackMutation.mutate(trackId),
        },
      ]
    );
  };

  const renderTrack = ({ item }: { item: { track: Track } }) => {
    const track = item.track;
    return (
      <View style={styles.trackCard}>
        <TouchableOpacity
          style={styles.trackInfo}
          onPress={() => router.push(`/track/${track.id}`)}
        >
          <Text style={styles.trackName} numberOfLines={1}>
            {track.name}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track.artist.name}
          </Text>
          {track.albumName && (
            <Text style={styles.trackAlbum} numberOfLines={1}>
              {track.albumName}
            </Text>
          )}
        </TouchableOpacity>

        <View style={styles.trackRight}>
          <Text style={styles.trackDuration}>
            {formatDuration(track.duration)}
          </Text>
          <TouchableOpacity
            style={styles.removeButton}
            onPress={() => handleRemoveTrack(track.id, track.name)}
          >
            <IconSymbol name="xmark.circle.fill" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!playlist) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Playlist not found</Text>
      </View>
    );
  }

  const totalDuration = getTotalDuration();

  return (
    <>
      <Stack.Screen
        options={{
          title: playlist.name,
          headerBackTitle: 'Back',
        }}
      />
      <View style={styles.container}>
        {/* Playlist Header */}
        <View style={styles.playlistHeader}>
          <View style={styles.playlistIcon}>
            <IconSymbol name="music.note.list" size={48} color="#6366F1" />
          </View>
          <Text style={styles.playlistName}>{playlist.name}</Text>
          {playlist.description && (
            <Text style={styles.playlistDescription}>
              {playlist.description}
            </Text>
          )}
          <Text style={styles.playlistMeta}>
            {playlist.playlistTracks.length} tracks • {formatTotalDuration(totalDuration)}
          </Text>
        </View>

        {/* Tracks List */}
        {playlist.playlistTracks.length === 0 ? (
          <View style={styles.emptyTracks}>
            <IconSymbol name="music.note.list" size={64} color="#9CA3AF" />
            <Text style={styles.emptyTracksTitle}>No tracks yet</Text>
            <Text style={styles.emptyTracksSubtitle}>
              Add tracks to this playlist from the track details page
            </Text>
          </View>
        ) : (
          <FlatList
            data={playlist.playlistTracks}
            renderItem={renderTrack}
            keyExtractor={(item) => String(item.track.id)}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </>
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
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
  },
  playlistHeader: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  playlistIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  playlistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 8,
  },
  playlistMeta: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  emptyTracks: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },
  emptyTracksTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
  },
  emptyTracksSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
  list: {
    padding: 16,
  },
  trackCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 2,
  },
  trackAlbum: {
    fontSize: 12,
    color: '#6B7280',
  },
  trackRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  trackDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  removeButton: {
    padding: 4,
  },
});
