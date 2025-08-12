"use client";

import { useDJEngine, Song } from '@/hooks/useDJEngine';
import { useState } from 'react';

// Deck Component
interface DeckProps {
  side: 'left' | 'right';
  djState: any;
  songs: Song[];
  onSongSelect: (song: Song) => void;
  onTogglePlayback: () => void;
  onVolumeChange: (volume: number) => void;
}

function Deck({ side, djState, songs, onSongSelect, onTogglePlayback, onVolumeChange }: DeckProps) {
  const deckState = side === 'left' ? djState.leftDeck : djState.rightDeck;
  const isLeft = side === 'left';
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className={`fixed top-4 ${isLeft ? 'left-4' : 'right-4'} z-40 transition-all duration-300`}>
      <div className={`bg-gradient-to-b from-gray-100/10 to-gray-200/5 backdrop-blur-md rounded-lg border border-gray-300/20 shadow-2xl transition-all duration-300 ${
        isExpanded ? 'w-64 p-4' : 'w-16 p-2'
      }`}>
        
        {/* Collapse/Expand Button */}
        <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-end'} mb-2`}>
          <div className={`text-gray-200 font-mono text-xs uppercase tracking-wider transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0 hidden'
          }`}>
            {isLeft ? 'Left Record' : 'Right Record'}
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-300/60 hover:text-gray-200 transition-colors p-1 rounded"
          >
            <div className="w-3 h-3 flex items-center justify-center">
              {isExpanded ? '−' : '+'}
            </div>
          </button>
        </div>

        {/* Status Indicator */}
        <div className="flex justify-center mb-3">
          <div className={`h-1 rounded-full transition-all duration-300 ${
            isExpanded ? 'w-8' : 'w-10'
          } ${deckState.isPlaying ? 'bg-red-500 animate-pulse' : 'bg-gray-300/30'}`} />
        </div>

        {/* Expanded Content */}
        <div className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {/* Song Selection */}
          <div className="space-y-2 mb-4">
            {songs.map((song) => {
              const isCurrentSong = deckState.currentSong?.id === song.id;
              const isQueuedSong = deckState.queuedSong?.id === song.id;
              
              return (
                <button
                  key={song.id}
                  onClick={() => onSongSelect(song)}
                  className={`w-full p-2 text-xs rounded transition-all font-mono relative ${
                    isCurrentSong
                      ? `${isLeft ? 'bg-blue-500/20 border-blue-400/40' : 'bg-red-500/20 border-red-400/40'} text-white border`
                      : isQueuedSong
                      ? 'bg-yellow-500/20 border border-yellow-400/40 text-yellow-200'
                      : 'bg-black/20 border border-gray-300/10 text-gray-200/80 hover:bg-gray-300/10'
                  }`}
                  disabled={deckState.isLoading || deckState.isQueueLoading}
                >
                  <div className="truncate">{song.title}</div>
                  {isQueuedSong && (
                    <div className="absolute top-0 right-0 text-yellow-400 text-xs">Q</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex items-center space-x-3">
            
            {/* Play/Pause Button */}
            <button
              onClick={onTogglePlayback}
              disabled={(!deckState.currentSong && !deckState.queuedSong) || deckState.isLoading}
              className={`flex-1 py-2 px-3 rounded font-mono text-xs transition-all ${
                deckState.isPlaying
                  ? deckState.queuedSong
                    ? 'bg-yellow-500/20 border border-yellow-400/40 text-yellow-300 hover:bg-yellow-500/30'
                    : 'bg-red-500/20 border border-red-400/40 text-red-300 hover:bg-red-500/30'
                  : 'bg-green-500/20 border border-green-400/40 text-green-300 hover:bg-green-500/30'
              } disabled:bg-gray-500/20 disabled:border-gray-500/20 disabled:text-gray-500`}
            >
              {deckState.isLoading 
                ? 'LOADING' 
                : deckState.isPlaying && deckState.queuedSong
                  ? 'NEXT'
                  : deckState.isPlaying 
                    ? 'PAUSE' 
                    : 'PLAY'
              }
            </button>

            {/* Vertical Volume Slider */}
            <div className="flex flex-col relative items-end">
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={deckState.volume}
                onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                className=" w-full bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-gray-300/60 text-xs font-mono mt-1">VOL</div>
              <div className="text-gray-300/60 text-xs font-mono">
                {Math.round(deckState.volume * 100)}
              </div>
            </div>
          </div>

          {/* Current Song Display */}
          {(deckState.currentSong || deckState.queuedSong) && (
            <div className="mt-3 pt-3 border-t border-gray-300/10">
              {deckState.currentSong && (
                <div>
                  <div className="text-gray-200/80 text-xs font-mono text-center truncate">
                    {deckState.currentSong.title}
                  </div>
                  <div className={`text-center text-xs font-mono mt-1 ${
                    deckState.isPlaying ? 'text-red-400 animate-pulse' : 'text-gray-300/60'
                  }`}>
                    {deckState.isPlaying ? '● REC' : '○ STOP'}
                  </div>
                </div>
              )}
              
              {deckState.queuedSong && (
                <div className="mt-2 pt-2 border-t border-yellow-400/20">
                  <div className="text-yellow-300/80 text-xs font-mono text-center truncate">
                    NEXT: {deckState.queuedSong.title}
                  </div>
                  <div className="text-center text-xs font-mono mt-1 text-yellow-400/60">
                    {deckState.isQueueLoading ? 'LOADING...' : '⏯ QUEUED'}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Collapsed Content - Quick Controls */}
        <div className={`transition-all duration-300 ${
          isExpanded ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-32 opacity-100'
        }`}>
          {/* Quick Play/Pause */}
          <button
            onClick={onTogglePlayback}
            disabled={!deckState.currentSong || deckState.isLoading}
            className={`w-full py-2 mb-2 rounded font-mono text-xs transition-all ${
              deckState.isPlaying
                ? 'bg-red-500/20 text-red-300'
                : 'bg-green-500/20 text-green-300'
            } disabled:bg-gray-500/20 disabled:text-gray-500`}
          >
            {deckState.isPlaying ? '⏸' : '▶'}
          </button>
          
          {/* Mini Volume */}
          <div className="text-center">
            <div className="text-gray-300/60 text-xs font-mono mb-1">
              {Math.round(deckState.volume * 100)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Crossfader Component
interface CrossfaderProps {
  value: number;
  onChange: (value: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
}

function Crossfader({ value, onChange, masterVolume, onMasterVolumeChange }: CrossfaderProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300 min-w-64">
      <div className={`bg-gradient-to-b from-gray-100/10 to-gray-200/5 backdrop-blur-md rounded-lg border border-gray-300/20 shadow-2xl transition-all duration-300 ${
        isExpanded ? 'px-6 py-4' : 'px-3 py-2'
      }`}>
        
        {/* Control Panel Header */}
        <div className="flex items-center justify-between mb-2">
          <div className={`text-gray-200 font-mono text-xs uppercase tracking-wider transition-opacity duration-300 ${
            isExpanded ? 'opacity-100' : 'opacity-0'
          }`}>
            Control Panel
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-300/60 hover:text-gray-200 transition-colors p-1 rounded"
          >
            <div className="w-3 h-3 flex items-center justify-center">
              {isExpanded ? '−' : '+'}
            </div>
          </button>
        </div>

        {/* Expanded Content */}
        <div className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          {/* Crossfader */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <div className="text-gray-300/60 text-xs font-mono">L</div>
            <div className="flex flex-col items-center">
              <div className="text-gray-300/60 text-xs font-mono mb-1">CROSSFADER</div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={value}
                onChange={(e) => onChange(parseFloat(e.target.value))}
                className="w-32 h-2 bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-gray-300/60 text-xs font-mono mt-1">
                {value < -0.1 ? 'LEFT' : value > 0.1 ? 'RIGHT' : 'CENTER'}
              </div>
            </div>
            <div className="text-gray-300/60 text-xs font-mono">R</div>
          </div>

          {/* Master Volume */}
          <div className="flex items-center justify-center space-x-3 pt-3 border-t border-gray-300/10">
            <div className="text-gray-300/60 text-xs font-mono">MASTER</div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="w-24 h-2 bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-gray-300/60 text-xs font-mono">
              {Math.round(masterVolume * 100)}
            </div>
          </div>
        </div>

        {/* Collapsed Content - Mini Crossfader */}
        <div className={`transition-all duration-300 ${
          isExpanded ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-16 opacity-100'
        }`}>
          <div className="flex items-center space-x-2">
            <div className="text-gray-300/60 text-xs font-mono">L</div>
            <input
              type="range"
              min="-1"
              max="1"
              step="0.01"
              value={value}
              onChange={(e) => onChange(parseFloat(e.target.value))}
              className="w-16 h-1 bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-gray-300/60 text-xs font-mono">R</div>
            <div className="text-gray-300/60 text-xs font-mono ml-2">
              M:{Math.round(masterVolume * 100)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DJBoard() {
  const {
    djState,
    loadSong,
    togglePlayback,
    setCrossfader,
    setDeckVolume,
    setMasterVolume,
  } = useDJEngine();

  // Left Deck Songs - Hip Hop & Electronic
  const leftDeckSongs: Song[] = [
    {
      id: 'L1',
      title: 'Cinematic Hip Hop Vlog Music',
      artist: 'Unknown Artist',
      url: '/audio/Cinematic Hip Hop Vlog Music.mp3'
    },
    {
      id: 'L2',
      title: 'Happy Sad Feeling Guitar',
      artist: 'RockerPlate',
      url: '/audio/Happy Sad Feeling Guitar by RockerPlate.mp3'
    },
    {
      id: 'L3',
      title: 'Stargazer',
      artist: 'Alien I Trust (125 BPM)',
      url: '/audio/Stargazer by Alien I Trust 125 BPM.wav'
    }
  ];

  // Right Deck Songs - Ambient & Guitar
  const rightDeckSongs: Song[] = [
    {
      id: 'R1', 
      title: 'Tell Me What',
      artist: 'Unknown Artist',
      url: '/audio/Tell Me What.mp3'
    },
    {
      id: 'R2',
      title: 'Situation Sample Pack',
      artist: 'Xhale303',
      url: '/audio/Situation Sample Pack by Xhale303.wav'
    },
    {
      id: 'R3',
      title: 'Slow Ethereal Piano Loop',
      artist: '80 BPM',
      url: '/audio/Slow Ethereal Piano Loop 80 BPM.wav'
    }
  ];

  return (
    <>
      {/* Left Deck */}
      <Deck
        side="left"
        djState={djState}
        songs={leftDeckSongs}
        onSongSelect={(song) => loadSong(song, 'left')}
        onTogglePlayback={() => togglePlayback('left')}
        onVolumeChange={(volume) => setDeckVolume('left', volume)}
      />

      {/* Right Deck */}
      <Deck
        side="right"
        djState={djState}
        songs={rightDeckSongs}
        onSongSelect={(song) => loadSong(song, 'right')}
        onTogglePlayback={() => togglePlayback('right')}
        onVolumeChange={(volume) => setDeckVolume('right', volume)}
      />

      {/* Crossfader Control Panel */}
      <Crossfader
        value={djState.crossfaderValue}
        onChange={setCrossfader}
        masterVolume={djState.masterVolume}
        onMasterVolumeChange={setMasterVolume}
      />
    </>
  );
}