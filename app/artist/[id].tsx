import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { artistsApi, tracksApi } from '@/lib/api/endpoints';
import type { Track, TrackStatus } from '@/lib/api/types';
import { buildGuessSongText } from '@/lib/guessSongText';

const STATUS_OPTIONS: { value: TrackStatus; label: string; color: string }[] = [
  { value: 'idea', label: 'Idea', color: '#6B7280' },
  { value: 'ready', label: 'Ready', color: '#3B82F6' },
  { value: 'recorded', label: 'Recorded', color: '#F59E0B' },
  { value: 'posted', label: 'Posted', color: '#10B981' },
];

export default function ArtistDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const artistId = parseInt(id as string);

  const { data: artist, isLoading: artistLoading } = useQuery({
    queryKey: ['artist', artistId],
    queryFn: () => artistsApi.getArtist(artistId),
  });

  const { data: tracks, isLoading: tracksLoading, refetch } = useQuery({
    queryKey: ['artist-tracks', artistId],
    queryFn: () => artistsApi.getArtistTracks(artistId),
  });

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleUpdateStatus = async (trackId: number, status: TrackStatus) => {
    try {
      await tracksApi.updateTrackStatus(trackId, { status });
      refetch();
      Alert.alert('Success', 'Status updated');
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleToggleStar = async (track: Track) => {
    try {
      const newStarred = !track.trackStatus?.starred;
      await tracksApi.updateTrackStatus(track.id, { starred: newStarred });
      refetch();
    } catch (error) {
      console.error('Star error:', error);
      Alert.alert('Error', 'Failed to update');
    }
  };

  const handleToggleIgnore = async (track: Track) => {
    try {
      const newIgnored = !track.trackStatus?.ignored;
      await tracksApi.updateTrackStatus(track.id, {
        ignored: newIgnored,
        ...(newIgnored ? { starred: false } : {}),
      });
      refetch();
      Alert.alert('Success', newIgnored ? 'Marked as ignored' : 'Re-enabled track');
    } catch (error) {
      console.error('Ignore error:', error);
      Alert.alert('Error', 'Failed to update');
    }
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

  const handleDeleteTrack = (track: Track) => {
    Alert.alert(
      'Delete Track',
      `Delete "${track.name}" from the library?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tracksApi.deleteTrack(track.id);
              Alert.alert('Deleted', 'Track removed');
              refetch();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete track');
            }
          },
        },
      ],
    );
  };

  if (artistLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!artist) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Artist not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: artist.name,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container}>
        {/* Artist Header */}
        <View style={styles.artistHeader}>
          {artist.imageUrl ? (
            <Image
              source={{ uri: artist.imageUrl }}
              style={styles.artistImage}
            />
          ) : (
            <View style={styles.artistImagePlaceholder}>
              <IconSymbol name="person.fill" size={48} color="#9CA3AF" />
            </View>
          )}
          <Text style={styles.artistName}>{artist.name}</Text>
        </View>

        {/* Tracks Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tracks</Text>

          {tracksLoading ? (
            <View style={styles.loadingTracks}>
              <ActivityIndicator color="#6366F1" />
            </View>
          ) : !tracks || tracks.length === 0 ? (
            <View style={styles.emptyTracks}>
              <IconSymbol name="music.note.list" size={48} color="#9CA3AF" />
              <Text style={styles.emptyTracksText}>No tracks yet</Text>
            </View>
          ) : (
            tracks.map((track) => (
              <View key={track.id} style={styles.trackCard}>
                <View style={styles.trackHeader}>
                  <View style={styles.trackInfo}>
                    <Text style={styles.trackName} numberOfLines={2}>
                      {track.name}
                    </Text>
                    {track.albumName && (
                      <Text style={styles.trackAlbum} numberOfLines={1}>
                        {track.albumName}
                      </Text>
                    )}
                    <Text style={styles.trackDuration}>
                      {formatDuration(track.duration)}
                    </Text>
                  </View>

                  <TouchableOpacity
                    style={styles.starButton}
                    onPress={() => handleToggleStar(track)}
                  >
                    <IconSymbol
                      name={track.trackStatus?.starred ? 'star.fill' : 'star'}
                      size={24}
                      color={track.trackStatus?.starred ? '#F59E0B' : '#D1D5DB'}
                    />
                  </TouchableOpacity>
                </View>

                {/* Status Buttons */}
                <View style={styles.statusButtons}>
                  {STATUS_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.statusButton,
                        track.trackStatus?.status === option.value && {
                          backgroundColor: option.color,
                          borderColor: option.color,
                        },
                      ]}
                      onPress={() => handleUpdateStatus(track.id, option.value)}
                    >
                      <Text
                        style={[
                          styles.statusButtonText,
                          track.trackStatus?.status === option.value && styles.statusButtonTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {track.note ? (
                  <Text style={styles.trackNote}>{track.note}</Text>
                ) : null}

                <View style={styles.trackActions}>
                  <TouchableOpacity
                    style={styles.trackActionButton}
                    onPress={() => router.push(`/track/${track.id}`)}
                  >
                    <IconSymbol name="music.note.list" size={18} color="#0EA5E9" />
                    <Text style={styles.trackActionText}>Open</Text>
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
                    onPress={() => handleDeleteTrack(track)}
                  >
                    <IconSymbol name="trash" size={18} color="#EF4444" />
                    <Text style={[styles.trackActionText, styles.trackActionDangerText]}>
                      Delete
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
  artistHeader: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  artistImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  artistImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  artistName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },
  loadingTracks: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTracks: {
    padding: 40,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  emptyTracksText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  trackCard: {
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
  trackHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
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
  trackAlbum: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  trackDuration: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  starButton: {
    padding: 4,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#fff',
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
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  trackActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  trackActionDanger: {
    borderColor: '#FEE2E2',
    backgroundColor: '#FFF1F2',
  },
  trackActionDangerText: {
    color: '#EF4444',
  },
});
