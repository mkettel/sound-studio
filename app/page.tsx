"use client";

import VideoScrubberFrames from "@/components/VideoScrubberFrames";
import DJBoard from "@/components/DJBoard";
import DJControls from "@/components/DJControls";
import MasterVolume from "@/components/MasterVolume";
import Crossfader from "@/components/Crossfader";
import LoadingSequence from "@/components/LoadingSequence";
import { useDJEngine, Song } from '@/hooks/useDJEngine';
import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const crossfaderRef = useRef<HTMLDivElement>(null);
  
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
    // Only load songs after loading sequence completes
    if (!isLoading) {
      console.log('Loading initial songs...', { leftDeckSongs, rightDeckSongs });
      
      // Load both songs in parallel
      const loadInitialSongs = async () => {
        try {
          if (leftDeckSongs.length > 0 && !djState.leftDeck.currentSong) {
            console.log('Loading left deck song:', leftDeckSongs[0]);
            await loadSong(leftDeckSongs[0], 'left');
          }
          if (rightDeckSongs.length > 0 && !djState.rightDeck.currentSong) {
            console.log('Loading right deck song:', rightDeckSongs[0]);
            await loadSong(rightDeckSongs[0], 'right');
          }
        } catch (error) {
          console.error('Error loading initial songs:', error);
        }
      };
      
      loadInitialSongs();
    }
  }, [isLoading]); // Only depend on isLoading to avoid circular dependencies

  const handleLoadingComplete = () => {
    console.log('Loading sequence complete, setting isLoading to false');
    setIsLoading(false);
  };

  // Debug effect to monitor djState changes
  useEffect(() => {
    console.log('DJ State updated:', {
      leftDeck: djState.leftDeck.currentSong?.title || 'No song',
      rightDeck: djState.rightDeck.currentSong?.title || 'No song',
      leftLoading: djState.leftDeck.isLoading,
      rightLoading: djState.rightDeck.isLoading
    });
  }, [djState.leftDeck.currentSong, djState.rightDeck.currentSong, djState.leftDeck.isLoading, djState.rightDeck.isLoading]);

  // Animate crossfader in when app is ready
  useEffect(() => {
    if (!isLoading && crossfaderRef.current) {
      gsap.fromTo(crossfaderRef.current, 
        {
          opacity: 0
        },
        {
          opacity: 1,
          duration: 1.0,
          delay: 0.2, // Delay to let queue panels fade first
          ease: "power2.out"
        }
      );
    }
  }, [isLoading]);

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
      {/* Loading Sequence */}
      {isLoading && (
        <LoadingSequence onComplete={handleLoadingComplete} />
      )}

      {/* Fullscreen video background */}
      <div className="fixed inset-0 w-full h-full">
        <VideoScrubberFrames isAppReady={!isLoading} />
      </div>

      {/* Crossfader - Center position */}
      {!isLoading && (
        <div 
          ref={crossfaderRef}
          className="fixed bottom-16 left-1/2 transform -translate-x-1/2 z-50"
          style={{ opacity: 0 }} // Start invisible for GSAP
        >
          <Crossfader 
            value={djState.crossfaderValue}
            onValueChange={setCrossfader}
            className=""
          />
        </div>
      )}

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
        isAppReady={!isLoading}
      />
    </main>
  );
}
