import { apiClient } from './client';
import type {
  Track,
  Artist,
  Playlist,
  SearchResult,
  RandomTrack,
  TrackStatus
} from './types';

// Search
export const searchApi = {
  search: async (term: string, entity: 'musicArtist' | 'song' | 'album') => {
    const response = await apiClient.get<{ results: SearchResult[] }>(
      `/api/search?term=${encodeURIComponent(term)}&entity=${entity}`
    );
    return response.data;
  },

  getSearchStatus: async (entity: string, ids: number[]) => {
    const response = await apiClient.post('/api/search/status', { entity, ids });
    return response.data;
  },
};

// Save
export const saveApi = {
  saveArtist: async (artistId: number, artistName: string, imageUrl?: string) => {
    const response = await apiClient.post('/api/save/artist', {
      artistId,
      artistName,
      imageUrl,
    });
    return response.data;
  },

  saveTrack: async (trackId: number) => {
    const response = await apiClient.post('/api/save/track', { trackId });
    return response.data;
  },

  saveAlbum: async (collectionId: number) => {
    const response = await apiClient.post('/api/save/album', { collectionId });
    return response.data;
  },
};

// Tracks
export const tracksApi = {
  getTracks: async () => {
    const response = await apiClient.get<Track[]>('/api/tracks');
    return response.data;
  },

  getTrack: async (id: number) => {
    const response = await apiClient.get<Track>(`/api/track/${id}`);
    return response.data;
  },

  updateTrackStatus: async (
    id: number,
    data: { status?: TrackStatus; starred?: boolean; ignored?: boolean; note?: string }
  ) => {
    const response = await apiClient.post(`/api/track/${id}/status`, data);
    return response.data;
  },

  deleteTrack: async (id: number) => {
    const response = await apiClient.delete(`/api/track/${id}`);
    return response.data;
  },

  postLog: async (id: number) => {
    const response = await apiClient.post(`/api/track/${id}/postlog`);
    return response.data;
  },
};

// Artists
export const artistsApi = {
  getArtists: async () => {
    const response = await apiClient.get<Artist[]>('/api/artists');
    return response.data;
  },

  getArtist: async (id: number) => {
    const response = await apiClient.get<Artist>(`/api/artist/${id}`);
    return response.data;
  },

  getArtistTracks: async (id: number) => {
    const response = await apiClient.get<Track[]>(`/api/artist/${id}/tracks`);
    return response.data;
  },

  getArtistAlbums: async (id: number) => {
    const response = await apiClient.get(`/api/artist/${id}/albums`);
    return response.data;
  },
};

// Playlists
export const playlistsApi = {
  getPlaylists: async () => {
    const response = await apiClient.get<Playlist[]>('/api/playlist');
    return response.data;
  },

  getPlaylist: async (id: number) => {
    const response = await apiClient.get<Playlist>(`/api/playlist/${id}`);
    return response.data;
  },

  getPlaylistTracks: async (id: number) => {
    const response = await apiClient.get<Track[]>(`/api/playlist/${id}/tracks`);
    return response.data;
  },
};

// Random
export const randomApi = {
  getRandomTrack: async (mode: 'starred' | 'all' = 'all') => {
    const response = await apiClient.get<{ track: RandomTrack | null }>(
      `/api/random-starred?mode=${mode}`
    );
    return response.data;
  },
};
