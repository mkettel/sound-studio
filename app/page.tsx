"use client";

import VideoScrubberFrames from "@/components/VideoScrubberFrames";
import DJBoard from "@/components/DJBoard";
import DJControls from "@/components/DJControls";
import MasterVolume from "@/components/MasterVolume";
import Crossfader from "@/components/Crossfader";
import { useDJEngine, Song } from '@/hooks/useDJEngine';
import { useState, useEffect } from 'react';

export default function Home() {
  const {
    djState,
    loadSong,
    togglePlayback,
    nextSong,
    previousSong,
    setCrossfader,
    setDeckVolume,
    setMasterVolume,
    seekDeck,
    getDeckProgress,
  } = useDJEngine();

  // Left Deck Songs - Hip Hop & Electronic
  const leftDeckSongs: Song[] = [
    {
      id: 'L1',
      title: 'Cinematic Hip Hop Vlog Music',
      artist: 'Rocky Slade',
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
    },  
    {
      id: 'L4',
      title: 'Stargazer',
      artist: 'Alien I Trust (125 BPM)',
      url: '/audio/Stargazer by Alien I Trust 125 BPM.wav'
    },
    {
      id: 'L5',
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
      artist: 'Timber Cat',
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

  // Auto-load first songs on mount - using useEffect with empty dependency array
  useEffect(() => {
    if (leftDeckSongs.length > 0) {
      loadSong(leftDeckSongs[0], 'left');
    }
    if (rightDeckSongs.length > 0) {
      loadSong(rightDeckSongs[0], 'right');
    }
  }, []); // Empty dependency array - only run once on mount

  // Navigation functions using the new DJ engine functions
  const handleLeftPrev = () => {
    previousSong('left', leftDeckSongs);
  };

  const handleLeftNext = () => {
    nextSong('left', leftDeckSongs);
  };

  const handleRightPrev = () => {
    previousSong('right', rightDeckSongs);
  };

  const handleRightNext = () => {
    nextSong('right', rightDeckSongs);
  };

  return (
    <main className="relative min-h-screen">
      {/* Fullscreen video background */}
      <div className="fixed inset-0 w-full h-full">
        <VideoScrubberFrames />
      </div>

      {/* Crossfader - Center position */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50">
        <Crossfader 
          value={djState.crossfaderValue}
          onValueChange={setCrossfader}
          className=""
        />
      </div>

      {/* Master Volume Control - Right side */}
      <div className="fixed hidden bottom-14 right-8 z-50">
        <MasterVolume 
          volume={djState.masterVolume}
          onVolumeChange={setMasterVolume}
          className=""
        />
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
        getLeftProgress={() => getDeckProgress('left')}
        getRightProgress={() => getDeckProgress('right')}
        onLeftScrub={(p) => {
          const d = djState.leftDeck.currentSong?.duration || djState.leftDeck.currentSong?.buffer?.duration || 0;
          if (d) seekDeck('left', p * d);
        }}
        onRightScrub={(p) => {
          const d = djState.rightDeck.currentSong?.duration || djState.rightDeck.currentSong?.buffer?.duration || 0;
          if (d) seekDeck('right', p * d);
        }}
      />
    </main>
  );
}
