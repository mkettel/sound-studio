"use client";

import VideoScrubberFrames from "@/components/VideoScrubberFrames";
import DJBoard from "@/components/DJBoard";
import DJControls from "@/components/DJControls";
import { useDJEngine, Song } from '@/hooks/useDJEngine';
import { useState, useEffect } from 'react';

export default function Home() {
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

  // Track current song indices
  const [leftSongIndex, setLeftSongIndex] = useState(0);
  const [rightSongIndex, setRightSongIndex] = useState(0);

  // Auto-load first songs on mount - using useEffect with empty dependency array
  useEffect(() => {
    if (leftDeckSongs.length > 0) {
      loadSong(leftDeckSongs[0], 'left');
    }
    if (rightDeckSongs.length > 0) {
      loadSong(rightDeckSongs[0], 'right');
    }
  }, []); // Empty dependency array - only run once on mount

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
    <main className="relative min-h-screen">
      {/* Fullscreen video background */}
      <div className="fixed inset-0 w-full h-full">
        <VideoScrubberFrames />
      </div>

      {/* DJ Interface - Always Present, Collapsible */}
      {/* <DJBoard /> */}
      <DJControls 
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
      />
    </main>
  );
}
