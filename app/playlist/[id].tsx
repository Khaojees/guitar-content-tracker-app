import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { playlistsApi, tracksApi } from '@/lib/api/endpoints';
import { apiClient } from '@/lib/api/client';
import type { Track } from '@/lib/api/types';
import { buildGuessSongText } from '@/lib/guessSongText';

const STATUS_LABELS: Record<string, string> = {
  idea: 'Idea',
  ready: 'Ready',
  recorded: 'Recorded',
  posted: 'Posted',
};

const STATUS_COLORS: Record<string, string> = {
  idea: '#E5E7EB',
  ready: '#BFDBFE',
  recorded: '#FDE68A',
  posted: '#BBF7D0',
};

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

  const updateTrackStatusMutation = useMutation({
    mutationFn: async ({
      trackId,
      data,
    }: {
      trackId: number;
      data: { status?: string; starred?: boolean; ignored?: boolean };
    }) => {
      return tracksApi.updateTrackStatus(trackId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlist', playlistId] });
    },
    onError: () => {
      Alert.alert('Error', 'Failed to update track');
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

  const handleToggleStar = (track: Track) => {
    updateTrackStatusMutation.mutate({
      trackId: track.id,
      data: { starred: !(track.trackStatus?.starred ?? false) },
    });
  };

  const handleToggleIgnore = (track: Track) => {
    const newIgnored = !(track.trackStatus?.ignored ?? false);
    updateTrackStatusMutation.mutate({
      trackId: track.id,
      data: {
        ignored: newIgnored,
        ...(newIgnored ? { starred: false } : {}),
      },
    });
  };

  const handleCopyGuessText = async (track: Track) => {
    try {
      await Clipboard.setStringAsync(buildGuessSongText(track.name, track.artist.name));
      Alert.alert('Copied', 'Guess text copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const handleOpenYouTube = (track: Track) => {
    const query = `${track.name} ${track.artist.name}`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    Linking.openURL(url).catch((err) => {
      console.error('YouTube error:', err);
      Alert.alert('Error', 'Unable to open YouTube');
    });
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
    const statusKey = track.trackStatus?.status ?? 'idea';
    return (
      <View style={styles.trackCard}>
        <View style={styles.trackRow}>
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

          <View style={styles.trackMeta}>
            <View style={styles.trackBadges}>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: STATUS_COLORS[statusKey] ?? '#E5E7EB' },
                ]}
              >
                <Text style={styles.statusPillText}>
                  {STATUS_LABELS[statusKey] ?? 'Idea'}
                </Text>
              </View>
              {track.trackStatus?.starred && (
                <IconSymbol name="star.fill" size={18} color="#F59E0B" />
              )}
              {track.trackStatus?.ignored && (
                <IconSymbol name='eye.slash.fill' size={18} color="#F97316" />
              )}
            </View>
            <Text style={styles.trackDuration}>
              {formatDuration(track.duration)}
            </Text>
          </View>
        </View>

        {track.note ? (
          <Text style={styles.trackNote} numberOfLines={2}>
            {track.note}
          </Text>
        ) : null}

        <View style={styles.trackActions}>
          <TouchableOpacity
            style={styles.trackActionButton}
            onPress={() => handleToggleStar(track)}
          >
            <IconSymbol
              name={track.trackStatus?.starred ? 'star.fill' : 'star'}
              size={18}
              color={track.trackStatus?.starred ? '#F59E0B' : '#6B7280'}
            />
            <Text style={styles.trackActionText}>
              {track.trackStatus?.starred ? 'Starred' : 'Star'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trackActionButton}
            onPress={() => handleToggleIgnore(track)}
          >
            <IconSymbol
              name={track.trackStatus?.ignored ? 'eye.slash.fill' : 'eye'}
              size={18}
              color={track.trackStatus?.ignored ? '#F97316' : '#6B7280'}
            />
            <Text style={styles.trackActionText}>
              {track.trackStatus?.ignored ? 'Ignored' : 'Ignore'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trackActionButton}
            onPress={() => handleCopyGuessText(track)}
          >
            <IconSymbol name="doc.on.doc" size={18} color="#4F46E5" />
            <Text style={styles.trackActionText}>Guess</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.trackActionButton}
            onPress={() => handleOpenYouTube(track)}
          >
            <IconSymbol name="play.circle" size={18} color="#EF4444" />
            <Text style={styles.trackActionText}>YouTube</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.trackActionButton, styles.trackActionDanger]}
            onPress={() => handleRemoveTrack(track.id, track.name)}
          >
            <IconSymbol name="trash" size={18} color="#EF4444" />
            <Text style={[styles.trackActionText, styles.trackActionDangerText]}>
              Remove
            </Text>
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
    flexDirection: 'column',
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
  trackRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  trackInfo: {
    flex: 1,
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
  trackMeta: {
    alignItems: 'flex-end',
    gap: 6,
  },
  trackBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#1F2937',
  },
  trackDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  trackNote: {
    marginTop: 8,
    fontSize: 12,
    color: '#4B5563',
  },
  trackActions: {
    marginTop: 12,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  trackActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  trackActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  trackActionDanger: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF1F2',
  },
  trackActionDangerText: {
    color: '#EF4444',
  },
});
