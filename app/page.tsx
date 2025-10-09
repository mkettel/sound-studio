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
      title: 'Is My Mic On',
      artist: 'Lou Phelps',
      url: '/audio/Is My Mic On - Lou Phelps.mp3'
    },
    {
      id: 'L2',
      title: '4 My Children',
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps 4 My Children.mp3'
    },
    {
      id: 'L3',
      title: 'After I',
      artist: 'Lou Phelps Ft Goldlink',
      url: '/audio/Lou Phelps After I Ft Goldlink.mp3'
    },
    {
      id: 'L4',
      title: 'Afterparty',
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps Afterparty LDMIX2MASTER2.mp3'
    },
    {
      id: 'L5',
      title: 'BBW Luh',
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps BBW Luh LDMIX2 Master.mp3'
    }
  ];

  // Right Deck Songs - Ambient & Guitar
  const rightDeckSongs: Song[] = [
    {
      id: 'R1',
      title: 'I Dunno',
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps I Dunno Master Aug 9 2023.mp3'
    },
    {
      id: 'R2',
      title: 'JUNGLE',
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps JUNGLE LDMIX3MASTER2.mp3'
    },
    {
      id: 'R3',
      title: 'Shady Pitched Up',
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps Shady Pitched Up.mp3'
    },
    {
      id: 'R4',
      title: "Tu T'en Souviens",
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps Tu T\'en Souviens.mp3'
    },
    {
      id: 'R5',
      title: 'Under My Skin',
      artist: 'Lou Phelps Ft Nono Black',
      url: '/audio/Lou Phelps Under My Skin Ft Nono Black.mp3'
    },
    {
      id: 'R6',
      title: 'Toutes les nanas (Interlude)',
      artist: 'Lou Phelps',
      url: '/audio/Lou Phelps - Toutes les nanas (Interlude) - LDMIX5MASTER1.mp3'
    }
  ];

  // Auto-load first songs on mount - using useEffect with empty dependency array
  useEffect(() => {
    // Only load songs after loading sequence completes
    if (!isLoading) {
      // Load both songs in parallel
      const loadInitialSongs = async () => {
        try {
          if (leftDeckSongs.length > 0 && !djState.leftDeck.currentSong) {
            await loadSong(leftDeckSongs[0], 'left');
          }
          if (rightDeckSongs.length > 0 && !djState.rightDeck.currentSong) {
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
    setIsLoading(false);
  };


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
        onLeftSelectSong={(song) => {
          loadSong(song, 'left');
        }}
        onRightSelectSong={(song) => {
          loadSong(song, 'right');
        }}
        isAppReady={!isLoading}
      />
    </main>
  );
}
