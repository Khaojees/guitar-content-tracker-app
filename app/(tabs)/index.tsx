import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Link, useRouter } from 'expo-router';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { playlistsApi } from '@/lib/api/endpoints';
import type { Playlist } from '@/lib/api/types';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  {
    key: 'search',
    href: '/search',
    title: 'Search',
    icon: 'magnifyingglass' as const,
    color: '#3B82F6',
  },
  {
    key: 'tracks',
    href: '/tracks',
    title: 'Tracks',
    icon: 'music.note.list' as const,
    color: '#10B981',
  },
  {
    key: 'random',
    href: '/random',
    title: 'Random',
    icon: 'shuffle' as const,
    color: '#F59E0B',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { data: playlists, isLoading } = useQuery({
    queryKey: ['playlists'],
    queryFn: playlistsApi.getPlaylists,
  });

  const formatDuration = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m`;
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Guitar Content Tracker</Text>
          <Text style={styles.subtitle}>
            Keep tabs on the songs, artists, and ideas you want to produce next
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          {QUICK_ACTIONS.map((action) => (
            <Link key={action.key} href={action.href} asChild>
              <TouchableOpacity style={styles.actionCard}>
                <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                  <IconSymbol name={action.icon} size={28} color="#fff" />
                </View>
                <Text style={styles.actionTitle}>{action.title}</Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>

        {/* Playlists Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Playlists</Text>
            {playlists && playlists.length > 0 && (
              <Link href="/playlists" asChild>
                <TouchableOpacity>
                  <Text style={styles.viewAll}>View all</Text>
                </TouchableOpacity>
              </Link>
            )}
          </View>

          {isLoading ? (
            <View style={styles.loading}>
              <ActivityIndicator size="large" color="#6366F1" />
            </View>
          ) : !playlists || playlists.length === 0 ? (
            <View style={styles.emptyState}>
              <IconSymbol name="music.note.list" size={48} color="#9CA3AF" />
              <Text style={styles.emptyText}>No playlists yet</Text>
            </View>
          ) : (
            <View style={styles.playlistGrid}>
              {playlists.slice(0, 6).map((playlist) => {
                const totalDuration = playlist.playlistTracks.reduce(
                  (sum, pt) => sum + (pt.track.duration || 0),
                  0
                );
                return (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistCard}
                    onPress={() => router.push(`/playlist/${playlist.id}`)}
                  >
                    <View style={styles.playlistIcon}>
                      <IconSymbol name="music.note.list" size={24} color="#6366F1" />
                    </View>
                    <Text style={styles.playlistName} numberOfLines={2}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.playlistInfo}>
                      {playlist.playlistTracks.length} tracks • {formatDuration(totalDuration)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
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
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    gap: 12,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  viewAll: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  loading: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  playlistGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  playlistCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  playlistIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  playlistName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  playlistInfo: {
    fontSize: 12,
    color: '#6B7280',
  },
});
