"use client";

import { useDJEngine, Song } from '@/hooks/useDJEngine';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import AudioVisualizer from './AudioVisualizer';
import { useIsMobile } from '@/hooks/useIsMobile';

// Control Panel Component
interface ControlPanelProps {
  djState: any;
  leftDeckSongs: Song[];
  rightDeckSongs: Song[];
  onLeftTogglePlayback: () => void;
  onRightTogglePlayback: () => void;
  onLeftPrev: () => void;
  onLeftNext: () => void;
  onRightPrev: () => void;
  onRightNext: () => void;
  crossfaderValue: number;
  onCrossfaderChange: (value: number) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
  getFrequencyData: () => Uint8Array;
}

function ControlPanel({ 
  djState, 
  leftDeckSongs, 
  rightDeckSongs, 
  onLeftTogglePlayback, 
  onRightTogglePlayback,
  onLeftPrev,
  onLeftNext,
  onRightPrev,
  onRightNext,
  crossfaderValue,
  onCrossfaderChange,
  masterVolume, 
  onMasterVolumeChange, 
  getFrequencyData 
}: ControlPanelProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const isMobile = useIsMobile();
  const [leftCurrentSongId, setLeftCurrentSongId] = useState<string | null>(null);
  const [rightCurrentSongId, setRightCurrentSongId] = useState<string | null>(null);
  
  const leftSongCardRef = useRef<HTMLDivElement>(null);
  const rightSongCardRef = useRef<HTMLDivElement>(null);
  const leftThumbnailRef = useRef<HTMLDivElement>(null);
  const rightThumbnailRef = useRef<HTMLDivElement>(null);

  // Animate left deck song changes
  useEffect(() => {
    const leftSong = djState?.leftDeck.currentSong;
    if (leftSong && leftSong.id !== leftCurrentSongId) {
      const songCard = leftSongCardRef.current;
      const thumbnail = leftThumbnailRef.current;
      
      if (songCard && thumbnail) {
        gsap.fromTo(songCard,
          { opacity: 0.6, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
        );
        gsap.fromTo(thumbnail,
          { scale: 0.9, opacity: 0.7 },
          { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }
        );
      }
      setLeftCurrentSongId(leftSong.id);
    }
  }, [djState?.leftDeck.currentSong, leftCurrentSongId]);

  // Animate right deck song changes
  useEffect(() => {
    const rightSong = djState?.rightDeck.currentSong;
    if (rightSong && rightSong.id !== rightCurrentSongId) {
      const songCard = rightSongCardRef.current;
      const thumbnail = rightThumbnailRef.current;
      
      if (songCard && thumbnail) {
        gsap.fromTo(songCard,
          { opacity: 0.6, scale: 0.95 },
          { opacity: 1, scale: 1, duration: 0.6, ease: "power2.out" }
        );
        gsap.fromTo(thumbnail,
          { scale: 0.9, opacity: 0.7 },
          { scale: 1, opacity: 1, duration: 0.8, ease: "power2.out" }
        );
      }
      setRightCurrentSongId(rightSong.id);
    }
  }, [djState?.rightDeck.currentSong, rightCurrentSongId]);

  // Animate loading states for left deck
  useEffect(() => {
    const thumbnail = leftThumbnailRef.current;
    if (thumbnail) {
      if (djState?.leftDeck.isLoading) {
        gsap.to(thumbnail, {
          opacity: 0.4,
          scale: 0.9,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true
        });
      } else {
        gsap.killTweensOf(thumbnail);
        gsap.to(thumbnail, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }
  }, [djState?.leftDeck.isLoading]);

  // Animate loading states for right deck
  useEffect(() => {
    const thumbnail = rightThumbnailRef.current;
    if (thumbnail) {
      if (djState?.rightDeck.isLoading) {
        gsap.to(thumbnail, {
          opacity: 0.4,
          scale: 0.9,
          duration: 0.8,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true
        });
      } else {
        gsap.killTweensOf(thumbnail);
        gsap.to(thumbnail, {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "power2.out"
        });
      }
    }
  }, [djState?.rightDeck.isLoading]);
  return (
    <div className="fixed bottom-2 left-1/2 transform -translate-x-1/2 z-40 transition-all duration-300">
      <div className={`bg-gradient-to-b from-gray-100/10 to-gray-200/5 backdrop-blur-md rounded-lg border border-gray-300/20 shadow-2xl transition-all duration-300 ${
        isExpanded ? 'px-6 py-2' : 'px-8 py-2'
      }`} style={{ minWidth: '75vw' }}>
        
        {/* Control Panel Header */}
        <div className=" items-center hidden justify-between mb-2">
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

        {/* Expanded Content - Horizontal Layout */}
        <div className={`transition-all duration-300 overflow-hidden ${
          isExpanded ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'
        }`}>
          <div className="flex items-center justify-between">
            
            {/* Left Side - Crossfader
            <div className="flex items-center space-x-6">
              <div className="text-white text-xs font-mono">L</div>
              <div className="flex flex-col items-center">
                <div className="text-white text-xs font-mono mb-2">CROSSFADER</div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={crossfaderValue}
                  onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
                  className="w-fit h-2 bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-white text-xs font-mono mt-2">
                  {crossfaderValue < -0.1 ? 'LEFT' : crossfaderValue > 0.1 ? 'RIGHT' : 'CENTER'}
                </div>
              </div>
              <div className="text-white text-xs font-mono">R</div>
            </div> */}

            <div ref={leftSongCardRef} className="flex mr-4 gap-2">
              {/* Left Deck Info */}
              <div 
                ref={leftThumbnailRef}
                className="w-10 h-10 bg-white/10 rounded-md overflow-hidden"
              >
                <img src="/song-thumb.png" alt="Song Thumbnail" width={40} height={40}/>
              </div>
              <div className="flex flex-col items-start h-full">
                <div className="text-white text-xs font-mono truncate max-w-32">
                  {djState.leftDeck.currentSong?.title || 'No Song'}
                </div>
                <div className="text-white/60 text-xs font-mono truncate max-w-32">
                  {djState.leftDeck.currentSong?.artist || 'Unknown'}
                </div>
              </div>
              {/* Left Deck Controls */}
              <div className="flex gap-2 mx-4">
                <button 
                  onClick={onLeftTogglePlayback} 
                  className={`${djState.leftDeck.isPlaying ? 'text-red-400' : 'text-green-400'} hover:text-white transition-colors mr-2`}
                  disabled={!djState.leftDeck.currentSong || djState.leftDeck.isLoading}
                >
                  {djState.leftDeck.isPlaying ? (
                    <div className="w-3 h-3 flex gap-0.5 items-center">
                      <div className="bg-current h-3 w-1"></div>
                      <div className="bg-current h-3 w-1"></div>
                    </div>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.5 7.5L0.500001 12.5L1.5 6.5L0.5 0.5L12.5 5.5L12.5 7.5Z" fill="currentColor"/>
                    </svg>
                  )}
                </button>
                <button onClick={onLeftPrev} className="text-white hover:text-white/70 transition-colors" disabled={djState.leftDeck.isLoading}>
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.37114e-07 7.5L12 12.5L11 6.5L12 0.5L6.11959e-07 5.5L4.37114e-07 7.5Z" fill="currentColor"/>
                  </svg>  
                </button>
                <button onClick={onLeftNext} className="text-white hover:text-white/70 transition-colors" disabled={djState.leftDeck.isLoading}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 7.5L0.500001 12.5L1.5 6.5L0.5 0.5L12.5 5.5L12.5 7.5Z" fill="currentColor"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Center - Audio Visualizer */}
            <div className="flex items-center bg-white/10 rounded-lg overflow-hidden flex-1 justify-center">
              <AudioVisualizer 
                getFrequencyData={getFrequencyData} 
                height={70}
              />
            </div>

            <div ref={rightSongCardRef} className="flex flex-row-reverse gap-2 ml-4">
              {/* Right Deck Info */}
              <div 
                ref={rightThumbnailRef}
                className="w-10 h-10 bg-white/10 rounded-md overflow-hidden"
              >
                <img src="/song-thumb.png" alt="Song Thumbnail" width={40} height={40}/>
              </div>
              <div className="flex flex-col items-end h-full">
                <div className="text-white text-xs font-mono truncate max-w-32">
                  {djState.rightDeck.currentSong?.title || 'No Song'}
                </div>
                <div className="text-white/60 text-xs font-mono truncate max-w-32">
                  {djState.rightDeck.currentSong?.artist || 'Unknown'}
                </div>
              </div>
              {/* Right Deck Controls */}
              <div className="flex gap-2 mx-4">
                <button onClick={onRightPrev} className="text-white hover:text-white/70 transition-colors" disabled={djState.rightDeck.isLoading}>
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.37114e-07 7.5L12 12.5L11 6.5L12 0.5L6.11959e-07 5.5L4.37114e-07 7.5Z" fill="currentColor"/>
                  </svg>  
                </button>
                <button onClick={onRightNext} className="text-white hover:text-white/70 transition-colors" disabled={djState.rightDeck.isLoading}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M12.5 7.5L0.500001 12.5L1.5 6.5L0.5 0.5L12.5 5.5L12.5 7.5Z" fill="currentColor"/>
                  </svg>
                </button>
                <button 
                  onClick={onRightTogglePlayback} 
                  className={`${djState.rightDeck.isPlaying ? 'text-red-400' : 'text-green-400'} hover:text-white transition-colors ml-2`}
                  disabled={!djState.rightDeck.currentSong || djState.rightDeck.isLoading}
                >
                  {djState.rightDeck.isPlaying ? (
                    <div className="w-3 h-3 flex gap-0.5 items-center">
                      <div className="bg-current h-3 w-1"></div>
                      <div className="bg-current h-3 w-1"></div>
                    </div>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.5 7.5L0.500001 12.5L1.5 6.5L0.5 0.5L12.5 5.5L12.5 7.5Z" fill="currentColor"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Right Side - Master Volume */}
            <div className="flex items-center hidden space-x-3">
              <div className="text-white text-xs font-mono">MASTER</div>
              <div className="flex flex-col items-center">
                <div className="text-white text-xs font-mono mb-2">VOLUME</div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={masterVolume}
                  onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
                  className="w-fit h-2 bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
                />
                <div className="text-white text-xs font-mono mt-2">
                  {Math.round(masterVolume * 100)}%
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Collapsed Content - Mini Controls with Visualizer */}
        <div className={`transition-all duration-300 ${
          isExpanded ? 'max-h-0 opacity-0 overflow-hidden' : 'max-h-16 opacity-100'
        }`}>
          <div className="flex items-center justify-between space-x-8">
            {/* Mini Crossfader */}
            <div className="flex items-center space-x-3">
              <div className="text-white text-xs font-mono">L</div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.01"
                value={crossfaderValue}
                onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
                className="w-32 h-1 bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-white text-xs font-mono">R</div>
            </div>

            <div className="flex gap-2 items-center">
              {/* Song Thumbnail */}
              <div className="w-10 h-10 bg-white/10 rounded-md">
                <img src="/song-thumb.png" alt="Song Thumbnail" width={40} height={40} />
              </div>
            </div>

            {/* Mini Visualizer - Center */}
            <div className="flex-1 flex justify-center">
              <AudioVisualizer 
                getFrequencyData={getFrequencyData} 
                height={isMobile ? 50 : 100}
              />
            </div>

            {/* Mini Master Volume */}
            <div className="flex items-center space-x-3">
              <div className="text-white text-xs font-mono">M</div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={masterVolume}
                onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
                className="w-20 h-1 bg-gray-300/20 rounded-lg appearance-none cursor-pointer"
              />
              <div className="text-white text-xs font-mono">
                {Math.round(masterVolume * 100)}
              </div>
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
    getFrequencyData,
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
      url: '/audio/Stargazer by Alien I Trust 125 BPM.mp3'
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
      url: '/audio/Situation Sample Pack by Xhale303.mp3'
    },
    {
      id: 'R3',
      title: 'Slow Ethereal Piano Loop',
      artist: '80 BPM',
      url: '/audio/Slow Ethereal Piano Loop 80 BPM.mp3'
    }
  ];

  // Track current song indices
  const [leftSongIndex, setLeftSongIndex] = useState(0);
  const [rightSongIndex, setRightSongIndex] = useState(0);

  // Auto-load first songs on mount
  useEffect(() => {
    if (leftDeckSongs.length > 0 && !djState.leftDeck.currentSong) {
      loadSong(leftDeckSongs[0], 'left');
    }
    if (rightDeckSongs.length > 0 && !djState.rightDeck.currentSong) {
      loadSong(rightDeckSongs[0], 'right');
    }
  }, [djState.leftDeck.currentSong, djState.rightDeck.currentSong, loadSong]);

  // Navigation functions that force immediate switching
  const handleLeftPrev = () => {
    const prevIndex = leftSongIndex > 0 ? leftSongIndex - 1 : leftDeckSongs.length - 1;
    setLeftSongIndex(prevIndex);
    
    // If playing, pause first, then load new song, then resume
    if (djState.leftDeck.isPlaying) {
      togglePlayback('left'); // Pause
      setTimeout(() => {
        loadSong(leftDeckSongs[prevIndex], 'left');
        setTimeout(() => {
          togglePlayback('left'); // Resume with new song
        }, 100);
      }, 50);
    } else {
      loadSong(leftDeckSongs[prevIndex], 'left');
    }
  };

  const handleLeftNext = () => {
    const nextIndex = leftSongIndex < leftDeckSongs.length - 1 ? leftSongIndex + 1 : 0;
    setLeftSongIndex(nextIndex);
    
    // If playing, pause first, then load new song, then resume
    if (djState.leftDeck.isPlaying) {
      togglePlayback('left'); // Pause
      setTimeout(() => {
        loadSong(leftDeckSongs[nextIndex], 'left');
        setTimeout(() => {
          togglePlayback('left'); // Resume with new song
        }, 100);
      }, 50);
    } else {
      loadSong(leftDeckSongs[nextIndex], 'left');
    }
  };

  const handleRightPrev = () => {
    const prevIndex = rightSongIndex > 0 ? rightSongIndex - 1 : rightDeckSongs.length - 1;
    setRightSongIndex(prevIndex);
    
    // If playing, pause first, then load new song, then resume
    if (djState.rightDeck.isPlaying) {
      togglePlayback('right'); // Pause
      setTimeout(() => {
        loadSong(rightDeckSongs[prevIndex], 'right');
        setTimeout(() => {
          togglePlayback('right'); // Resume with new song
        }, 100);
      }, 50);
    } else {
      loadSong(rightDeckSongs[prevIndex], 'right');
    }
  };

  const handleRightNext = () => {
    const nextIndex = rightSongIndex < rightDeckSongs.length - 1 ? rightSongIndex + 1 : 0;
    setRightSongIndex(nextIndex);
    
    // If playing, pause first, then load new song, then resume
    if (djState.rightDeck.isPlaying) {
      togglePlayback('right'); // Pause
      setTimeout(() => {
        loadSong(rightDeckSongs[nextIndex], 'right');
        setTimeout(() => {
          togglePlayback('right'); // Resume with new song
        }, 100);
      }, 50);
    } else {
      loadSong(rightDeckSongs[nextIndex], 'right');
    }
  };

  return (
    <ControlPanel
      djState={djState}
      leftDeckSongs={leftDeckSongs}
      rightDeckSongs={rightDeckSongs}
      onLeftTogglePlayback={() => togglePlayback('left')}
      onRightTogglePlayback={() => togglePlayback('right')}
      onLeftPrev={handleLeftPrev}
      onLeftNext={handleLeftNext}
      onRightPrev={handleRightPrev}
      onRightNext={handleRightNext}
      crossfaderValue={djState.crossfaderValue}
      onCrossfaderChange={setCrossfader}
      masterVolume={djState.masterVolume}
      onMasterVolumeChange={setMasterVolume}
      getFrequencyData={getFrequencyData}
    />
  );
}