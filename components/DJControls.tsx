"use client";

import { useDJEngine, Song } from '@/hooks/useDJEngine';
import { useState, useEffect } from 'react';
import QueuePanel from './QueuePanel';

interface DJControlsProps {
  djState?: any;
  leftDeckSongs?: Song[];
  rightDeckSongs?: Song[];
  onLeftTogglePlayback?: () => void;
  onRightTogglePlayback?: () => void;
  onLeftPrev?: () => void;
  onLeftNext?: () => void;
  onRightPrev?: () => void;
  onRightNext?: () => void;
  crossfaderValue?: number;
  onCrossfaderChange?: (value: number) => void;
  // Per-deck waveform helpers
  getLeftProgress?: () => number;
  getRightProgress?: () => number;
  onLeftScrub?: (progress: number) => void;
  onRightScrub?: (progress: number) => void;
}

export default function DJControls({ 
  djState, 
  leftDeckSongs = [], 
  rightDeckSongs = [],
  onLeftTogglePlayback = () => {},
  onRightTogglePlayback = () => {},
  onLeftPrev = () => {},
  onLeftNext = () => {},
  onRightPrev = () => {},
  onRightNext = () => {},
  crossfaderValue = 0,
  onCrossfaderChange = () => {},
  getLeftProgress,
  getRightProgress,
  onLeftScrub,
  onRightScrub,
}: DJControlsProps) {
  const [leftQueueExpanded, setLeftQueueExpanded] = useState(false);
  const [rightQueueExpanded, setRightQueueExpanded] = useState(false);

    return (
        <>
        {/* Deck Info Section - Above Button Group */}
        {djState && (
          <div className="flex hidden justify-between absolute w-full bottom-12 left-0 z-40">
            {/* Left Deck Info */}
            <div className="flex items-center p-3 rounded-r-lg">
              <div className="w-12 h-12 bg-white/10 rounded-md overflow-hidden mr-3">
                <img src="/song-thumb.png" alt="Song Thumbnail" width={48} height={48}/>
              </div>
              <div className="flex flex-col">
                <div className="text-white text-sm font-medium truncate max-w-32">
                  {djState.leftDeck.currentSong?.title || 'Song Title'}
                </div>
                <div className="text-white/60 text-xs truncate max-w-32">
                  {djState.leftDeck.currentSong?.artist || 'Artist Name'}
                </div>
              </div>
              {/* Left Deck Controls */}
              <div className="flex gap-2 ml-4">
                <button 
                  onClick={onLeftTogglePlayback} 
                  className={`${djState.leftDeck.isPlaying ? 'text-red-400' : 'text-green-400'} hover:text-white mr-4 transition-colors`}
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
                <div className="flex gap-4">
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
            </div>

            {/* Right Deck Info */}
            <div className="flex items-center border-black border-2 p-3 rounded-l-lg">
              {/* Right Deck Controls */}
              <div className="flex gap-2 mr-4 ">
                <div className="flex gap-4 mr-4">
                <button onClick={onRightPrev} className="text-white hover:text-white/70 transition-colors" disabled={djState.rightDeck.isLoading}>
                  <svg width="12" height="13" viewBox="0 0 12 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.37114e-07 7.5L12 12.5L11 6.5L12 0.5L6.11959e-07 5.5L4.37114e-07 7.5Z" fill="currentColor"/>
                  </svg>  
                </button>
                <button 
                  onClick={onRightTogglePlayback} 
                  className={`${djState.rightDeck.isPlaying ? 'text-red-400' : 'text-green-400'} hover:text-white mr-2 transition-colors`}
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
                <button onClick={onRightNext} className="text-white hover:text-white/70 transition-colors" disabled={djState.rightDeck.isLoading}>
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12.5 7.5L0.500001 12.5L1.5 6.5L0.5 0.5L12.5 5.5L12.5 7.5Z" fill="currentColor"/>
                    </svg>
                  </button>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <div className="text-white text-sm font-medium truncate max-w-32 text-right">
                  {djState.rightDeck.currentSong?.title || 'Song Title'}
                </div>
                <div className="text-white/60 text-xs truncate max-w-32 text-right">
                  {djState.rightDeck.currentSong?.artist || 'Artist Name'}
                </div>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-md overflow-hidden ml-4">
                <img src="/song-thumb.png" alt="Song Thumbnail" width={48} height={48}/>
              </div>
            </div>
          </div>
        )}
        
        {/* Crossfader - Same level as song controls but centered */}
        <div className="fixed bottom-12 hidden left-1/2 transform -translate-x-1/2 z-40">
          <div className=" px-6 py-4">
            <div className="flex items-center space-x-6">
              <div className="text-white text-sm font-mono">L</div>
              <div className="flex flex-col items-center">
                <div className="text-white text-xs font-mono mb-2 uppercase tracking-wider">CROSSFADER</div>
                <input
                  type="range"
                  min="-1"
                  max="1"
                  step="0.01"
                  value={crossfaderValue}
                  onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
                  className="w-48 h-2  rounded-lg  cursor-pointer "
                />
                <div className="text-white text-xs font-mono mt-2">
                  {crossfaderValue < -0.1 ? 'LEFT' : crossfaderValue > 0.1 ? 'RIGHT' : 'CENTER'}
                </div>
              </div>
              <div className="text-white text-sm font-mono">R</div>
            </div>
          </div>
        </div>

        {/* Left Queue Panel */}
        <QueuePanel
          title="PLAY QUEUE"
          position="left"
          isExpanded={leftQueueExpanded}
          currentSong={djState?.leftDeck.currentSong}
          queueSongs={leftDeckSongs}
          isPlaying={djState?.leftDeck.isPlaying}
          isLoading={djState?.leftDeck.isLoading}
          onToggleExpanded={() => setLeftQueueExpanded(!leftQueueExpanded)}
          onRemoveSong={(songId) => console.log('Remove left song:', songId)}
          onTogglePlayback={onLeftTogglePlayback}
          onPrevious={onLeftPrev}
          onNext={onLeftNext}
          getProgress={getLeftProgress}
          onScrub={onLeftScrub}
        />

        {/* Right Queue Panel */}
        <QueuePanel
          title="PLAY QUEUE"
          position="right"
          isExpanded={rightQueueExpanded}
          currentSong={djState?.rightDeck.currentSong}
          queueSongs={rightDeckSongs}
          isPlaying={djState?.rightDeck.isPlaying}
          isLoading={djState?.rightDeck.isLoading}
          onToggleExpanded={() => setRightQueueExpanded(!rightQueueExpanded)}
          onRemoveSong={(songId) => console.log('Remove right song:', songId)}
          onTogglePlayback={onRightTogglePlayback}
          onPrevious={onRightPrev}
          onNext={onRightNext}
          getProgress={getRightProgress}
          onScrub={onRightScrub}
        />

        </>
    )
}
