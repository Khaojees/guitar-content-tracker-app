import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { searchApi, saveApi } from '@/lib/api/endpoints';
import type { SearchResult } from '@/lib/api/types';

type EntityType = 'musicArtist' | 'song' | 'album';

export default function SearchScreen() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entity, setEntity] = useState<EntityType>('musicArtist');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!searchTerm.trim()) return;

    setLoading(true);
    try {
      const data = await searchApi.search(searchTerm, entity);
      setResults(data.results || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: SearchResult) => {
    const id = entity === 'musicArtist' ? item.artistId :
                entity === 'album' ? item.collectionId : item.trackId;
    if (!id) return;

    setSaving(String(id));
    try {
      if (entity === 'musicArtist' && item.artistId) {
        await saveApi.saveArtist(
          item.artistId,
          item.artistName || '',
          item.artworkUrl100 || item.artworkUrl60
        );
        Alert.alert('Success', 'Artist added successfully');
      } else if (entity === 'album' && item.collectionId) {
        await saveApi.saveAlbum(item.collectionId);
        Alert.alert('Success', 'Album added successfully');
      } else if (entity === 'song' && item.trackId) {
        await saveApi.saveTrack(item.trackId);
        Alert.alert('Success', 'Track added successfully');
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <View style={styles.container}>
      {/* Search Form */}
      <View style={styles.searchForm}>
        <TextInput
          style={styles.input}
          placeholder="Search iTunes..."
          value={searchTerm}
          onChangeText={setSearchTerm}
          onSubmitEditing={handleSearch}
          returnKeyType="search"
        />

        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={entity}
            onValueChange={(value) => setEntity(value as EntityType)}
          >
            <Picker.Item label="Artists" value="musicArtist" />
            <Picker.Item label="Songs" value="song" />
            <Picker.Item label="Albums" value="album" />
          </Picker>
        </View>

        <TouchableOpacity
          style={styles.searchButton}
          onPress={handleSearch}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <IconSymbol name="magnifyingglass" size={20} color="#fff" />
              <Text style={styles.searchButtonText}>Search</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Results */}
      <ScrollView style={styles.results}>
        {loading && results.length === 0 && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366F1" />
          </View>
        )}

        {!loading && results.length === 0 && searchTerm && (
          <View style={styles.emptyState}>
            <IconSymbol name="magnifyingglass" size={48} color="#9CA3AF" />
            <Text style={styles.emptyText}>No results found</Text>
          </View>
        )}

        {results.map((item, index) => {
          const id = entity === 'musicArtist' ? item.artistId :
                     entity === 'album' ? item.collectionId : item.trackId;
          const name = entity === 'musicArtist' ? item.artistName :
                       entity === 'album' ? item.collectionName : item.trackName;
          const subtitle = entity === 'song' ? item.artistName :
                          entity === 'album' ? item.artistName : item.primaryGenreName;
          const isSaving = saving === String(id);

          return (
            <View key={`${id}-${index}`} style={styles.resultCard}>
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={2}>
                  {name}
                </Text>
                {subtitle && (
                  <Text style={styles.resultSubtitle}>{subtitle}</Text>
                )}
                {entity === 'album' && item.trackCount && (
                  <Text style={styles.resultMeta}>{item.trackCount} tracks</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.saveButton, isSaving && styles.saveButtonDisabled]}
                onPress={() => handleSave(item)}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveButtonText}>Add</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchForm: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  searchButton: {
    height: 48,
    backgroundColor: '#6366F1',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  results: {
    flex: 1,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  resultCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  resultMeta: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});
