export type TrackStatus = 'idea' | 'ready' | 'recorded' | 'posted';

export interface Artist {
  id: number;
  name: string;
  imageUrl?: string | null;
}

export interface Album {
  id: number;
  name: string;
  imageUrl?: string | null;
}

export interface Track {
  id: number;
  name: string;
  albumName: string;
  duration: number | null;
  artist: Artist;
  album?: Album;
  trackStatus?: {
    status: TrackStatus;
    starred: boolean;
    ignored: boolean;
  };
  note?: string | null;
}

export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  playlistTracks: Array<{
    track: Track;
  }>;
}

export interface SearchResult {
  artistId?: number;
  artistName?: string;
  collectionId?: number;
  collectionName?: string;
  trackId?: number;
  trackName?: string;
  artworkUrl100?: string;
  artworkUrl60?: string;
  primaryGenreName?: string;
  trackCount?: number;
  trackTimeMillis?: number;
  artistLinkUrl?: string;
}

export interface RandomTrack {
  id: number;
  name: string;
  status: TrackStatus;
  duration: number | null;
  starred: boolean;
  ignored: boolean;
  artist: {
    id: number;
    name: string;
  };
  album: {
    name: string;
    imageUrl?: string | null;
  };
}
