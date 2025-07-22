import React, { useState, useEffect } from 'react';
import { observer } from 'mobx-react-lite';
import { useStore } from '@/stores/StoreProvider';
import { Key } from '@/components/Key';
import { Assets } from '@/assets';
import clsx from 'clsx';

interface Track {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number;
  artwork?: string;
}

interface Playlist {
  id: string;
  name: string;
  trackCount: number;
  icon: string;
}

const MusicControlWidget = observer(() => {
  const store = useStore();
  const [activeTab, setActiveTab] = useState<'now-playing' | 'playlists' | 'search'>('now-playing');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45);
  const [volume, setVolume] = useState(75);
  const [searchQuery, setSearchQuery] = useState('');
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');
  const [shuffle, setShuffle] = useState(false);

  // Mock current track
  const [currentTrack, setCurrentTrack] = useState<Track>({
    id: '1',
    title: 'Midnight City',
    artist: 'M83',
    album: 'Hurry Up, We\'re Dreaming',
    duration: 244,
    artwork: '🎵',
  });

  // Mock playlists
  const playlists: Playlist[] = [
    { id: '1', name: 'Discover Weekly', trackCount: 30, icon: '🎲' },
    { id: '2', name: 'Focus Flow', trackCount: 50, icon: '🧘' },
    { id: '3', name: 'Workout Mix', trackCount: 45, icon: '💪' },
    { id: '4', name: 'Chill Vibes', trackCount: 25, icon: '🌊' },
  ];

  // Mock search results
  const searchResults: Track[] = [
    { id: '2', title: 'Blinding Lights', artist: 'The Weeknd', album: 'After Hours', duration: 200 },
    { id: '3', title: 'Levitating', artist: 'Dua Lipa', album: 'Future Nostalgia', duration: 203 },
    { id: '4', title: 'Good 4 U', artist: 'Olivia Rodrigo', album: 'SOUR', duration: 178 },
  ];

  useEffect(() => {
    // Simulate playback progress
    const interval = setInterval(() => {
      if (isPlaying && currentTime < currentTrack.duration) {
        setCurrentTime(prev => Math.min(prev + 1, currentTrack.duration));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, currentTime, currentTrack.duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
    store.native?.showToast(isPlaying ? 'Paused' : 'Playing', 'success');
  };

  const handleNext = () => {
    store.native?.showToast('Next track', 'success');
  };

  const handlePrevious = () => {
    store.native?.showToast('Previous track', 'success');
  };

  const handleVolumeChange = (value: number) => {
    setVolume(value);
  };

  const handleSeek = (value: number) => {
    setCurrentTime(value);
  };

  const renderNowPlaying = () => (
    <div className="flex flex-col h-full">
      {/* Album Art */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-48 h-48 rounded-2xl bg-gradient-to-br from-[var(--hanzo-accent)] to-purple-600 flex items-center justify-center text-8xl shadow-2xl">
          {currentTrack.artwork}
        </div>
      </div>

      {/* Track Info */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold">{currentTrack.title}</h3>
        <p className="text-[var(--hanzo-text-secondary)]">{currentTrack.artist}</p>
        <p className="text-sm text-[var(--hanzo-text-tertiary)]">{currentTrack.album}</p>
      </div>

      {/* Progress Bar */}
      <div className="px-6 mb-4">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs text-[var(--hanzo-text-tertiary)]">{formatTime(currentTime)}</span>
          <div className="flex-1 relative h-1 bg-[var(--hanzo-bg-tertiary)] rounded-full">
            <div 
              className="absolute left-0 top-0 h-full bg-[var(--hanzo-accent)] rounded-full"
              style={{ width: `${(currentTime / currentTrack.duration) * 100}%` }}
            />
            <input
              type="range"
              min="0"
              max={currentTrack.duration}
              value={currentTime}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-xs text-[var(--hanzo-text-tertiary)]">{formatTime(currentTrack.duration)}</span>
        </div>
      </div>

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-4 mb-6">
        <button 
          onClick={() => setShuffle(!shuffle)}
          className={clsx(
            'p-2 rounded-lg transition-colors',
            shuffle ? 'text-[var(--hanzo-accent)]' : 'text-[var(--hanzo-text-tertiary)]'
          )}
        >
          🔀
        </button>
        <button onClick={handlePrevious} className="p-2 text-2xl">⏮️</button>
        <button 
          onClick={handlePlayPause} 
          className="p-4 rounded-full bg-[var(--hanzo-accent)] text-white text-2xl hover:opacity-90 transition-opacity"
        >
          {isPlaying ? '⏸️' : '▶️'}
        </button>
        <button onClick={handleNext} className="p-2 text-2xl">⏭️</button>
        <button 
          onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
          className={clsx(
            'p-2 rounded-lg transition-colors relative',
            repeat !== 'off' ? 'text-[var(--hanzo-accent)]' : 'text-[var(--hanzo-text-tertiary)]'
          )}
        >
          🔁
          {repeat === 'one' && <span className="absolute -top-1 -right-1 text-xs">1</span>}
        </button>
      </div>

      {/* Volume Control */}
      <div className="px-6 pb-6">
        <div className="flex items-center gap-2">
          <span className="text-sm">🔇</span>
          <div className="flex-1 relative h-1 bg-[var(--hanzo-bg-tertiary)] rounded-full">
            <div 
              className="absolute left-0 top-0 h-full bg-[var(--hanzo-text-secondary)] rounded-full"
              style={{ width: `${volume}%` }}
            />
            <input
              type="range"
              min="0"
              max="100"
              value={volume}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>
          <span className="text-sm">🔊</span>
        </div>
      </div>
    </div>
  );

  const renderPlaylists = () => (
    <div className="p-4">
      <div className="grid grid-cols-2 gap-3">
        {playlists.map((playlist) => (
          <button
            key={playlist.id}
            className="p-4 rounded-lg bg-[var(--hanzo-bg-secondary)] hover:bg-[var(--hanzo-bg-tertiary)] transition-colors text-left"
            onClick={() => store.native?.showToast(`Playing ${playlist.name}`, 'success')}
          >
            <div className="text-3xl mb-2">{playlist.icon}</div>
            <div className="font-medium">{playlist.name}</div>
            <div className="text-sm text-[var(--hanzo-text-tertiary)]">{playlist.trackCount} tracks</div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSearch = () => (
    <div className="flex flex-col h-full">
      <div className="p-4">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for songs, artists, albums..."
          className="w-full px-4 py-2 bg-[var(--hanzo-bg-secondary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--hanzo-accent)]"
        />
      </div>
      
      <div className="flex-1 overflow-y-auto px-4">
        {searchResults.map((track) => (
          <button
            key={track.id}
            className="w-full p-3 rounded-lg hover:bg-[var(--hanzo-bg-secondary)] transition-colors flex items-center gap-3 mb-2"
            onClick={() => {
              setCurrentTrack(track);
              setActiveTab('now-playing');
              setIsPlaying(true);
            }}
          >
            <div className="w-10 h-10 rounded bg-[var(--hanzo-bg-tertiary)] flex items-center justify-center">
              🎵
            </div>
            <div className="flex-1 text-left">
              <div className="font-medium">{track.title}</div>
              <div className="text-sm text-[var(--hanzo-text-secondary)]">{track.artist} • {track.album}</div>
            </div>
            <span className="text-sm text-[var(--hanzo-text-tertiary)]">{formatTime(track.duration)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  const tabs = [
    { id: 'now-playing', name: 'Now Playing', icon: '🎵' },
    { id: 'playlists', name: 'Playlists', icon: '📚' },
    { id: 'search', name: 'Search', icon: '🔍' },
  ];

  return (
    <div className="hanzo-window" style={{ height: '600px' }}>
      {/* Header */}
      <div className="hanzo-search">
        <img 
          src={Assets.HanzoWhiteSmall} 
          alt="Hanzo" 
          className="hanzo-search-icon"
          style={{ width: 24, height: 24, marginRight: 8 }}
        />
        <h2 className="text-lg font-semibold">Music Control</h2>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-sm text-[var(--hanzo-text-secondary)]">Spotify</span>
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[var(--hanzo-border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={clsx(
              'flex-1 py-3 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'text-[var(--hanzo-text)] border-b-2 border-[var(--hanzo-accent)]'
                : 'text-[var(--hanzo-text-secondary)] hover:text-[var(--hanzo-text)]'
            )}
          >
            <span className="mr-2">{tab.icon}</span>
            {tab.name}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'now-playing' && renderNowPlaying()}
        {activeTab === 'playlists' && renderPlaylists()}
        {activeTab === 'search' && renderSearch()}
      </div>

      {/* Footer */}
      <div className="hanzo-footer">
        <div className="hanzo-footer-hints">
          <span className="hanzo-footer-hint">
            <Key k="Space" size="small" /> Play/Pause
          </span>
          <span className="hanzo-footer-hint">
            <Key k="→" size="small" /> Next
          </span>
          <span className="hanzo-footer-hint">
            <Key k="←" size="small" /> Previous
          </span>
        </div>
      </div>
    </div>
  );
});

export { MusicControlWidget };