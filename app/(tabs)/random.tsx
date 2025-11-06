import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { randomApi, tracksApi } from '@/lib/api/endpoints';
import type { RandomTrack, TrackStatus } from '@/lib/api/types';

const STATUS_OPTIONS: { value: TrackStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'ready', label: 'Ready' },
  { value: 'recorded', label: 'Recorded' },
  { value: 'posted', label: 'Posted' },
];

export default function RandomScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<'all' | 'starred'>('all');
  const [track, setTrack] = useState<RandomTrack | null>(null);
  const [loading, setLoading] = useState(false);

  const getRandomTrack = async () => {
    setLoading(true);
    try {
      const data = await randomApi.getRandomTrack(mode);
      if (data.track) {
        setTrack(data.track);
      } else {
        Alert.alert('No tracks', 'No tracks available to randomize');
      }
    } catch (error) {
      console.error('Random error:', error);
      Alert.alert('Error', 'Failed to get random track');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newStatus: TrackStatus) => {
    if (!track) return;

    try {
      await tracksApi.updateTrackStatus(track.id, { status: newStatus });
      setTrack({ ...track, status: newStatus });
      Alert.alert('Success', 'Status updated');
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const toggleStar = async () => {
    if (!track) return;

    try {
      const newStarred = !track.starred;
      await tracksApi.updateTrackStatus(track.id, { starred: newStarred });
      setTrack({ ...track, starred: newStarred });
      Alert.alert('Success', newStarred ? 'Starred' : 'Unstarred');
    } catch (error) {
      console.error('Star error:', error);
      Alert.alert('Error', 'Failed to update');
    }
  };

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {mode === 'starred' ? 'Random Starred Track' : 'Random Track'}
          </Text>
          <Text style={styles.subtitle}>
            {mode === 'starred'
              ? 'Get a random track from your starred collection'
              : 'Get a random track from all tracks'}
          </Text>
        </View>

        {/* Mode Selector */}
        <View style={styles.modeSelector}>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'all' && styles.modeButtonActive]}
            onPress={() => {
              setMode('all');
              setTrack(null);
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'all' && styles.modeButtonTextActive]}>
              All Tracks
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeButton, mode === 'starred' && styles.modeButtonActive]}
            onPress={() => {
              setMode('starred');
              setTrack(null);
            }}
          >
            <Text style={[styles.modeButtonText, mode === 'starred' && styles.modeButtonTextActive]}>
              Starred Only
            </Text>
          </TouchableOpacity>
        </View>

        {/* Random Button */}
        <TouchableOpacity
          style={styles.randomButton}
          onPress={getRandomTrack}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol name="shuffle" size={24} color="#fff" />
              <Text style={styles.randomButtonText}>Get Random Track</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Track Display */}
        {track && (
          <View style={styles.trackCard}>
            {track.album.imageUrl && (
              <Image
                source={{ uri: track.album.imageUrl }}
                style={styles.albumArt}
              />
            )}

            <View style={styles.trackInfo}>
              <Text style={styles.trackName}>{track.name}</Text>
              <Text style={styles.artistName}>{track.artist.name}</Text>
              <Text style={styles.albumName}>{track.album.name}</Text>
              <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
            </View>

            {/* Status Picker */}
            <View style={styles.statusSection}>
              <Text style={styles.sectionLabel}>Status</Text>
              <View style={styles.statusButtons}>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.statusButton,
                      track.status === option.value && styles.statusButtonActive,
                    ]}
                    onPress={() => updateStatus(option.value)}
                  >
                    <Text
                      style={[
                        styles.statusButtonText,
                        track.status === option.value && styles.statusButtonTextActive,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <TouchableOpacity style={styles.actionButton} onPress={toggleStar}>
                <IconSymbol
                  name={track.starred ? 'star.fill' : 'star'}
                  size={24}
                  color={track.starred ? '#F59E0B' : '#6B7280'}
                />
                <Text style={styles.actionText}>
                  {track.starred ? 'Starred' : 'Star'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => router.push(`/artist/${track.artist.id}`)}
              >
                <IconSymbol name="person.fill" size={24} color="#6366F1" />
                <Text style={styles.actionText}>View Artist</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {!track && !loading && (
          <View style={styles.emptyState}>
            <IconSymbol name="shuffle" size={64} color="#9CA3AF" />
            <Text style={styles.emptyText}>
              Tap the button above to get a random track
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeButtonActive: {
    backgroundColor: '#fff',
  },
  modeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modeButtonTextActive: {
    color: '#6366F1',
  },
  randomButton: {
    backgroundColor: '#6366F1',
    borderRadius: 24,
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  randomButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  trackCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  albumArt: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    marginBottom: 20,
  },
  trackInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  trackName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  artistName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    marginBottom: 4,
  },
  albumName: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  duration: {
    fontSize: 14,
    color: '#9CA3AF',
    fontFamily: 'monospace',
  },
  statusSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  statusButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
