"use client";

import { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Song } from '@/hooks/useDJEngine';

interface QueuePanelProps {
  title: string;
  position: 'left' | 'right';
  isExpanded?: boolean;
  currentSong?: Song;
  queueSongs?: Song[];
  isPlaying?: boolean;
  isLoading?: boolean;
  onToggleExpanded?: () => void;
  onRemoveSong?: (songId: string) => void;
  onTogglePlayback?: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
}

export default function   QueuePanel({
  title,
  position,
  isExpanded = false,
  currentSong,
  queueSongs = [],
  isPlaying = false,
  isLoading = false,
  onToggleExpanded = () => {},
  onRemoveSong = () => {},
  onTogglePlayback = () => {},
  onPrevious = () => {},
  onNext = () => {}
}: QueuePanelProps) {
  const expandedContentRef = useRef<HTMLDivElement>(null);
  const arrowRef = useRef<SVGSVGElement>(null);
  const playingLabelRef = useRef<HTMLDivElement>(null);
  const removeButtonRef = useRef<HTMLButtonElement>(null);

  // Animate expand/collapse
  useEffect(() => {
    const content = expandedContentRef.current;
    const arrow = arrowRef.current;
    const playingLabel = playingLabelRef.current;
    const removeButton = removeButtonRef.current;

    if (!content || !arrow) return;

    if (isExpanded) {
      // Expanding animation - measure the natural height first
      gsap.set(content, { height: 'auto' });
      const autoHeight = content.offsetHeight;
      gsap.set(content, { height: 0 });
      
      gsap.to(content, { 
        height: autoHeight, 
        duration: 0.4, 
        ease: "power2.out" 
      });
      gsap.to(arrow, { 
        rotation: 180, 
        duration: 0.3, 
        ease: "power2.out" 
      });

      // Animate in the "PLAYING NOW" label and remove button
      if (playingLabel) {
        gsap.fromTo(playingLabel, 
          { opacity: 0, y: -10 },
          { opacity: 1, y: 0, duration: 0.3, delay: 0.1, ease: "power2.out" }
        );
      }
      if (removeButton) {
        gsap.fromTo(removeButton,
          { opacity: 0, scale: 0.8 },
          { opacity: 1, scale: 1, duration: 0.3, delay: 0.2, ease: "power2.out" }
        );
      }
    } else {
      // Collapsing animation - animate from current height to 0
      const currentHeight = content.offsetHeight;
      gsap.fromTo(content, 
        { height: currentHeight },
        { 
          height: 0, 
          duration: 0.3, 
          ease: "power2.inOut" 
        }
      );
      gsap.to(arrow, { 
        rotation: 0, 
        duration: 0.3, 
        ease: "power2.inOut" 
      });

      // Animate out the "PLAYING NOW" label and remove button first
      if (playingLabel) {
        gsap.to(playingLabel, { 
          opacity: 0, 
          y: -5, 
          duration: 0.15, 
          ease: "power2.inOut" 
        });
      }
      if (removeButton) {
        gsap.to(removeButton, {
          opacity: 0,
          scale: 0.8,
          duration: 0.15,
          ease: "power2.inOut"
        });
      }
    }
  }, [isExpanded]);

  return (
    <div className={`fixed top-6 ${position === 'left' ? 'left-6' : 'right-6'} z-40 max-w-72 min-w-72`}>
      <div className="bg-black/30 backdrop-blur-sm border border-white/90 overflow-hidden">
        {/* Header with toggle */}
        <div 
          className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
          onClick={onToggleExpanded}
        >
          <div className="text-white text-sm font-medium uppercase tracking-tight">
            {title}
          </div>
          <button className="text-white/60 hover:text-white transition-colors">
            <svg 
              ref={arrowRef}
              className="w-4 h-4"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Currently Playing Section - Always Visible */}
        {currentSong && (
          <div className="border-b border-white/10">
            <div className="px-4 py-2">
              <div 
                ref={playingLabelRef}
                className={`text-white/60 text-xs uppercase tracking-wider mb-2 ${isExpanded ? 'block' : 'hidden'}`}
              >
                PLAYING NOW
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/10 rounded overflow-hidden flex-shrink-0">
                  <img src="/song-thumb.png" alt="Album art" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {currentSong.title}
                  </div>
                  <div className="text-white/60 text-xs truncate">
                    {currentSong.artist}
                  </div>
                </div>
                <button 
                  ref={removeButtonRef}
                  className={`text-white/60 hover:text-white transition-colors p-1 ${isExpanded ? 'block' : 'hidden'}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSong(currentSong.id);
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Playback Controls - Always Visible */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPrevious();
              }}
              disabled={isLoading}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="19,20 9,12 19,4" />
                <line x1="5" y1="19" x2="5" y2="5" />
              </svg>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlayback();
              }}
              disabled={!currentSong || isLoading}
              className={`${isPlaying ? 'text-red-400' : 'text-green-400'} hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isPlaying ? (
                <div className="w-4 h-4 flex gap-1 items-center">
                  <div className="bg-current h-4 w-1.5 rounded-sm"></div>
                  <div className="bg-current h-4 w-1.5 rounded-sm"></div>
                </div>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5,3 19,12 5,21" />
                </svg>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onNext();
              }}
              disabled={isLoading}
              className="text-white/60 hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polygon points="5,4 15,12 5,20" />
                <line x1="19" y1="5" x2="19" y2="19" />
              </svg>
            </button>
          </div>
        </div>

        {/* Queue Section - Animated expand/collapse */}
        <div 
          ref={expandedContentRef}
          className="overflow-hidden"
        >
          <div className="px-4 py-2">
            <div className="text-white/60 text-xs uppercase tracking-tight mb-2">
              NEXT UP
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {queueSongs.filter(song => song.id !== currentSong?.id).slice(0, 4).map((song, index) => (
                <div key={song.id} className="flex items-center gap-3 p-2 pr-0 cursor-pointer rounded hover:bg-white/5 transition-colors">
                  <div className="w-8 h-8 bg-white/10 rounded overflow-hidden flex-shrink-0">
                    <img src="/song-thumb.png" alt="Album art" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {song.title}
                    </div>
                    <div className="text-white/60 text-xs truncate">
                      {song.artist}
                    </div>
                  </div>
                  <button 
                    className="text-white/60 hover:text-white transition-colors p-1"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRemoveSong(song.id);
                    }}
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}