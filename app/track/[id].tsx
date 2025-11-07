import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { tracksApi } from '@/lib/api/endpoints';
import type { TrackStatus } from '@/lib/api/types';
import { buildGuessSongText } from '@/lib/guessSongText';

const STATUS_OPTIONS: { value: TrackStatus; label: string; color: string }[] = [
  { value: 'idea', label: 'Idea', color: '#6B7280' },
  { value: 'ready', label: 'Ready', color: '#3B82F6' },
  { value: 'recorded', label: 'Recorded', color: '#F59E0B' },
  { value: 'posted', label: 'Posted', color: '#10B981' },
];

export default function TrackDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const trackId = parseInt(id as string);
  const [note, setNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);

  const { data: track, isLoading, refetch } = useQuery({
    queryKey: ['track', trackId],
    queryFn: () => tracksApi.getTrack(trackId),
  });

  const formatDuration = (ms: number | null) => {
    if (!ms) return '—';
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleUpdateStatus = async (status: TrackStatus) => {
    try {
      await tracksApi.updateTrackStatus(trackId, { status });
      refetch();
      Alert.alert('Success', 'Status updated');
    } catch (error) {
      console.error('Update error:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const handleToggleStar = async () => {
    if (!track) return;
    try {
      const newStarred = !track.trackStatus?.starred;
      await tracksApi.updateTrackStatus(trackId, { starred: newStarred });
      refetch();
    } catch (error) {
      console.error('Star error:', error);
      Alert.alert('Error', 'Failed to update');
    }
  };

  const handleToggleIgnored = async () => {
    if (!track) return;
    try {
      const newIgnored = !track.trackStatus?.ignored;
      await tracksApi.updateTrackStatus(trackId, { ignored: newIgnored });
      refetch();
    } catch (error) {
      console.error('Ignore error:', error);
      Alert.alert('Error', 'Failed to update');
    }
  };

  const handleSaveNote = async () => {
    setSavingNote(true);
    try {
      await tracksApi.updateTrackStatus(trackId, { note });
      refetch();
      Alert.alert('Success', 'Note saved');
    } catch (error) {
      console.error('Save note error:', error);
      Alert.alert('Error', 'Failed to save note');
    } finally {
      setSavingNote(false);
    }
  };

  const handleSearchYouTube = () => {
    if (!track) return;
    const query = `${track.name} ${track.artist.name}`;
    const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
    Linking.openURL(url);
  };

  const handleCopyGuessText = async () => {
    if (!track) return;
    try {
      await Clipboard.setStringAsync(buildGuessSongText(track.name, track.artist.name));
      Alert.alert('Copied', 'Guess text copied to clipboard');
    } catch (error) {
      console.error('Copy error:', error);
      Alert.alert('Error', 'Failed to copy text');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Track',
      'Are you sure you want to delete this track?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await tracksApi.deleteTrack(trackId);
              Alert.alert('Success', 'Track deleted');
              router.back();
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete track');
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  if (!track) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>Track not found</Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: track.name,
          headerBackTitle: 'Back',
        }}
      />
      <ScrollView style={styles.container}>
        {/* Track Info */}
        <View style={styles.trackHeader}>
          {track.album?.imageUrl && (
            <Image
              source={{ uri: track.album.imageUrl }}
              style={styles.albumArt}
            />
          )}
          <Text style={styles.trackName}>{track.name}</Text>
          <TouchableOpacity
            onPress={() => router.push(`/artist/${track.artist.id}`)}
          >
            <Text style={styles.artistName}>{track.artist.name}</Text>
          </TouchableOpacity>
          {track.albumName && (
            <Text style={styles.albumName}>{track.albumName}</Text>
          )}
          <Text style={styles.duration}>{formatDuration(track.duration)}</Text>
        </View>

        {/* Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
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
                onPress={() => handleUpdateStatus(option.value)}
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
        </View>

        {/* Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions</Text>
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.actionButton,
                track.trackStatus?.starred && styles.actionButtonActive,
              ]}
              onPress={handleToggleStar}
            >
              <IconSymbol
                name={track.trackStatus?.starred ? 'star.fill' : 'star'}
                size={20}
                color={track.trackStatus?.starred ? '#F59E0B' : '#6B7280'}
              />
              <Text style={styles.actionButtonText}>
                {track.trackStatus?.starred ? 'Starred' : 'Star'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.actionButton,
                track.trackStatus?.ignored && styles.actionButtonActive,
              ]}
              onPress={handleToggleIgnored}
            >
              <IconSymbol
                name={track.trackStatus?.ignored ? 'eye.slash.fill' : 'eye'}
                size={20}
                color="#6B7280"
              />
              <Text style={styles.actionButtonText}>
                {track.trackStatus?.ignored ? 'Ignored' : 'Ignore'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleSearchYouTube}
            >
              <IconSymbol name="play.circle" size={20} color="#EF4444" />
              <Text style={styles.actionButtonText}>YouTube</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCopyGuessText}
            >
              <IconSymbol name="doc.on.doc" size={20} color="#4F46E5" />
              <Text style={styles.actionButtonText}>Guess Text</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <IconSymbol name="trash" size={20} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Note Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Note</Text>
          <TextInput
            style={styles.noteInput}
            multiline
            numberOfLines={4}
            placeholder="Add a note..."
            value={note || track.note || ''}
            onChangeText={setNote}
          />
          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveNote}
            disabled={savingNote}
          >
            {savingNote ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Save Note</Text>
            )}
          </TouchableOpacity>
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
  trackHeader: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  albumArt: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 20,
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
  section: {
    padding: 16,
    backgroundColor: '#fff',
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  statusButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  statusButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B7280',
  },
  statusButtonTextActive: {
    color: '#fff',
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#fff',
  },
  actionButtonActive: {
    backgroundColor: '#FEF3C7',
    borderColor: '#F59E0B',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  deleteButton: {
    borderColor: '#FEE2E2',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#111827',
    backgroundColor: '#fff',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    marginTop: 12,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
